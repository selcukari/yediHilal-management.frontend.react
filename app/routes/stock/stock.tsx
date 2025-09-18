import { useState, useEffect, Fragment, useRef, useMemo } from 'react';
import { pick } from 'ramda';
import {
  Container, Grid, Table, Text, Stack, Title, RingProgress, Badge, Button,
  Paper, TextInput, LoadingOverlay, Flex, Group, ActionIcon,
} from '@mantine/core';
import { differenceInDays } from 'date-fns';
import { MenuActionButton } from '../../components'
import { IconSearch, IconTrash, IconEdit } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { randaomColor } from '../../utils/randaomColor';
import StockAdd, { type StockAddDialogControllerRef } from '../../components/stock/stockAdd';
import StockEdit, { type StockEditDialogControllerRef } from '../../components/stock/stockEdit';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';

interface StockData {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  createDate: string;
  name: string;
  updateDate: string;
  expirationDate?: string;
  nameKey: string;
  isActive: boolean;
  unitPrice: number;
  totalPrice?: number;
  count?: number;
  description?: string;
  fromWhere?: string;
  actions?: string;
}
interface Column {
  field: keyof StockData;
  header: string;
}

export default function Stock() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');
  const stockAddRef = useRef<StockAddDialogControllerRef>(null);
  const stockEditRef = useRef<StockEditDialogControllerRef>(null);

  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Ürün Adı' },
    { field: 'unitPrice', header: 'Birim Fiyat' },
    { field: 'count', header: 'Sayısı' },
    { field: 'totalPrice', header: 'Toplam Fiyat' },
    { field: 'description', header: 'Açıklama' },
    { field: 'updateUserFullName', header: 'Günceleyen Kişi' },
    { field: 'fromWhere', header: 'Son Tedarik Edilen Yer' },
    { field: 'expirationDate', header: 'Son Kullanma Tarih' },
    { field: 'createDate', header: 'İlk Kayıt' },
    { field: 'updateDate', header: 'Güncellenen Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  useEffect(() => {
    setTimeout(() => {
        fetchStock();
      }, 1000);
  }, []);

  const fetchStock = async () => {
    open();
    try {
      const getStock = await service.getStock();
      
      if (getStock) {
        
        setStockData(getStock);
      } else {
        toast.info('Hiçbir veri yok!');
        setStockData([]);
      }
    } catch (error: any) {
      toast.error(`Stok yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchStock();
    }, 1500);
  };

  const diffDateTimeForColor = (date?: string) => {
    if (!date) return "green";
    const daysDiff = differenceInDays(date, new Date());

    if (daysDiff > 7) return "green";

    if (new Date() >= new Date(date)) return "red";

    return "yellow";
  };

  const handleDelete = async(id: number) => {
     open();

    try {

      const result = await service.deleteStock(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchStock();
      
      close();

      return;
    }
    else if (result?.data == false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
      close();
    } catch (error: any) {
      toast.error(`silme işleminde bir hata: ${error.message}`);
      close();
    }
    
  }
  const handleEdit = (value: StockData) => {

    stockEditRef.current?.openDialog({
      ...value, unitPrice: value.unitPrice.toString(), count: value.count?.toString(),
    }, stockData.map(x => pick(['id', 'name', 'nameKey'], x)))
  }

    // Filtrelenmiş veriler
  const filteredStocks = useMemo(() => {
    if (!searchText) return stockData;
    
    return stockData.filter(stock =>
      stock.name.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      stock.updateUserFullName.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [stockData, searchText]);

  // raportdata
  const raportStockData = useMemo(() => {
    return filteredStocks.map((stock: StockData) => ({
      ...stock,
      createDate: formatDate(stock.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      expirationDate: formatDate(stock.expirationDate, dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredStocks])

  // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'updateDate' && col.field != 'description' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field,
      title: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
      width: calculateColumnWidthMember(col.field) // Özel genişlik hesaplama fonksiyonu
    }));
  }, [rowHeaders]);
  // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const excelTableColumns = useMemo((): ColumnDefinition[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'updateDate' && col.field != 'description' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);

  const reportTitle = (): string => {
    return "Stok Ürünler Raporu";
  }

  const rowsTable = filteredStocks.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
     
        if (['createDate', 'updateDate'].includes(header.field)) {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? formatDate(item[header.field] as string ?? null, dateFormatStrings.dateTimeFormatWithoutSecond): "-"}
            </Table.Td>
          );
        }

        if (header.field === 'count') {
          return (
            <Table.Td key={header.field}>
              {
                <Badge color={(item[header.field] || 0) > 50 ? 'green' : 'red'}>
                  {item[header.field]}
                </Badge>
              }
            </Table.Td>
          );
        }
        if (header.field === 'expirationDate') {
          return (
            <Table.Td key={header.field}>
              { 
              <Badge color={diffDateTimeForColor(item[header.field])}>
                {formatDate(item[header.field] as string ?? null, dateFormatStrings.dateTimeFormatWithoutSecond)}
              </Badge>
               
              }
            </Table.Td>
          );
        }
        else if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <ActionIcon 
                  variant="light" 
                  color="blue"
                  onClick={() => handleEdit(item)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" 
                  color="red"
                  disabled={diffDateTimeForColor(item["expirationDate"]) != "red"}
                  onClick={() => handleDelete(item.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          );
        }

        return (
          <Table.Td key={header.field}>
            {item[header.field] || '-'}
          </Table.Td>
        );
      })}
    </Table.Tr>
  ));

  const calculateTotal = () => {
    if (stockData?.length < 0) return 0;
    return stockData.reduce((total, item) => total + (item.count ?? 0), 0);
  };

  const handleAddItem = (data: any) => {
    console.log("handleAddItem")
  }

  return (
    <Container size="xl">
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Stack gap="lg">
          <Flex mih={50} gap="md" justify="center" align="center" direction="row" wrap="wrap">
            <RingProgress
              size={170}
              thickness={16}
              label={
                <Text size="xs" ta="center" px="xs" style={{ pointerEvents: 'none' }}>
                  Genel Toplam: {calculateTotal()}
                </Text>
              }
              sections={(stockData || []).map(item => ({
                value: ((item.count ?? 1) / Math.max(calculateTotal(), 1)) * 100,
                color: randaomColor(),
                tooltip: `${item.name}: ${item.count}`
              }))}
            />
          </Flex>
           {/* Sayfa Başlığı */}
            <Group justify="space-between" align="center">
              <div>
                <Title order={2}>Stok Sayfası</Title>
                <Text size="sm" c="dimmed">
                  Toolbar Filtreleme Alanı
                </Text>
              </div>
              <Button variant="filled" onClick={() => stockAddRef.current?.openDialog(
                stockData.map(x => pick(['id', 'name', 'nameKey'], x))
              )}>Yeni Ekle</Button>
              
            </Group>
            {/* İçerik Kartları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="Ürün adı veya Kullanıcı Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Flex
                  mih={50}
                  gap="md"
                  justify="flex-end"
                  align="flex-end"
                  direction="row"
                  wrap="wrap"
                >
                  <MenuActionButton
                  reportTitle={reportTitle()}
                  excelColumns={excelTableColumns}
                  valueData={raportStockData}
                  pdfColumns={pdfTableColumns}
                  type={2}
                  isMailDisabled={true}
                  isSmsDisabled={true}
                  />
                </Flex>
                </Grid.Col>
              </Grid>
            </Paper>
          </div>
          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Stok({rowsTable?.length || 0})</Title>
              <Table.ScrollContainer minWidth={400} maxHeight={700}>
                <Table striped highlightOnHover withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      {rowHeaders.map((header) => (
                        <Table.Th key={header.field}>{header.header}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rowsTable}</Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>
      </Stack>
      <StockAdd ref={stockAddRef} onSaveSuccess={handleSaveSuccess} />
      <StockEdit ref={stockEditRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Badge, Stack, Group, Title, Text, Paper,
  ActionIcon, Table, LoadingOverlay, Flex, Button,
} from '@mantine/core';
import { MenuActionButton } from '../../components'
import { useDisclosure } from '@mantine/hooks';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import StockUsedExpenseEdit, { type StockUsedExpenseEditDialogControllerRef } from '../../components/stock/stockUsedExpenseEdit';
import StockUsedAdd, { type StockUsedAddDialogControllerRef } from '../../components/stock/stockUsedAdd';
interface Column {
  field: string;
  header: string;
}
interface StockItem {
  name?: string;
  key?: string;
  count?: number;
}

interface StockUsedData {
  id: number;
  items: StockItem[];
  createDate: string;
  address?: string;
  title: string;
  note?: string;
  buyerInformations?: any;
  isDelivery?: boolean;
  projectId?: number;
  projectName?: string;
}

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

export default function StockUsedDeposit() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [stockDataItems, setStockDataItems] = useState<StockItem[] | null>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const stockUsedExpenseEditRef = useRef<StockUsedExpenseEditDialogControllerRef>(null);
  const stockUsedAddRef = useRef<StockUsedAddDialogControllerRef>(null);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'title', header: 'Başlık' },
    { field: 'projectName', header: 'Proje Adı' },
    { field: 'address', header: 'Adres' },
    { field: 'note', header: 'Note' },
    { field: 'items', header: 'Sarf' },
    { field: 'buyerInformations', header: 'Alıcı Bilgileri' },
    { field: 'isDelivery', header: 'Bitiş Durum' },
    { field: 'createDate', header: 'Kayıt Tarih' },
    { field: 'updateDate', header: 'Güncelleme Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  // Filtrelenmiş veriler
  const filteredStockUseds = useMemo(() => {
    if (!searchText) return resultData;

    return resultData.filter(stockUsed =>
      stockUsed.title.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      stockUsed.buyerInformations?.fullName?.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      stockUsed.note?.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchStockUsedExpense();
    }, 1000);
  }, []);

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchStockUsedExpense();
    }, 1000);
  };

  const renderBoolean = (value: boolean) => {
    return (
      <Badge color={!value ? 'green' : 'red'}>
        {!value ? 'Aktif' : 'Tamamlandı'}
      </Badge>
    );
  };

    const handleDelete = async (id: number) => {

      const result = await service.deleteStockUsed(id);
      if (result === true) {

        toast.success('İşlem başarılı!');

        fetchStockUsedExpense();
      
      return;
    }
    if (result?.data === false && result?.errors) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }

    }
    const handleEdit = (item: StockUsedData) => {
      stockUsedExpenseEditRef.current?.openDialog("Emanet Düzenle", item, stockDataItems || []);
    }
    const handleAddItem = () => {
      stockUsedAddRef.current?.openDialog("Emanet Ekle","deposit", stockDataItems || [])
    }

  const rowsTable = filteredStockUseds.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <ActionIcon 
                  variant="light" 
                  color="blue"
                  disabled={item.isDelivery as boolean}
                  onClick={() => handleEdit(item)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" 
                  color="red"
                  disabled={item.isDelivery as boolean}
                  onClick={() => handleDelete(item.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          );
        }
        if (header.field === 'buyerInformations') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field]["fullName"]}(${item[header.field]["phone"]})` : "-"}
            </Table.Td>
          );
        }
        if (header.field === 'isDelivery') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field])}
            </Table.Td>
          );
        }
        if (header.field === 'note') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field].substring(0,30)}...` : '-'}
            </Table.Td>
          );
        }
        if (header.field === 'address') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field].substring(0,25)}...` : '-'}
            </Table.Td>
          );
        }
        if (header.field === 'items') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field].map((item: any) => `${item.name}(${item.count})`).join(',').substring(0,25)}...` : '-'}
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

  const fetchStockUsedExpense = async () => {
     open();

    const type = "deposit";
  
     try {
      const getStock: StockData[] = await service.getStocks();

      const getStockUsedExpenses = await service.getStockUsed(type);
      if (getStockUsedExpenses && getStock.length > 0) {
        setResultData(getStockUsedExpenses.map((stockUsed: any) => ({
          id: stockUsed.id,
          buyerInformations: stockUsed.buyerInformations ? JSON.parse(stockUsed.buyerInformations) : null,
          items: stockUsed.items ? JSON.parse(stockUsed.items) : null,
          type: stockUsed.type,
          isDelivery: stockUsed.isDelivery, // true ise edit yapma
          isActive: stockUsed.isActive,
          title: stockUsed.title,
          address: stockUsed.address,
          note: stockUsed.note,
          projectId: stockUsed.projectId,
          projectName: stockUsed.projectName,
          createDate: formatDate(stockUsed.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          updateDate: formatDate(stockUsed.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond),
        })));
        setStockDataItems(getStock.map(item => ({
          name: item.name,
          key: item.nameKey,
          count: item.count,
        })))
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
        toast.error(`getStockUsedExpenses yüklenirken hata: ${error.message}`);
      close();
    }
  };
  // raportdata
  const raportStocUsedkData = useMemo(() => {
    return filteredStockUseds.map((stock: StockUsedData) => {
      const itemsData = stock.items ? `${stock.items?.map(item => `${item.name}(${item.count})`).join(',').substring(0,20)}...` : "-";
      return {
        ...stock,
      address: stock.address ? stock.address.substring(0,20) : "-",
      note: stock.note ? stock.note.substring(0,20) : "-",
      items: itemsData,
      isDelivery: stock.isDelivery ? "Tamamlandı": "Aktif",
      buyerInformations: stock.buyerInformations ? `${stock.buyerInformations["fullName"]}(${stock.buyerInformations["phone"]})` : "-",
      createDate: formatDate(stock.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      }
    })
  }, [filteredStockUseds])
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
      col.field != 'updateDate' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);
  const reportTitle = (): string => {
    return "Emanet Ürünler Raporu";
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
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Stok Emanet Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />}  onClick={handleAddItem}>Yeni Emanet Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={handleAddItem}
              hiddenFrom="xs"
              p="xs"
            >
              <IconPlus size={18} />
            </Button>
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

                <Grid.Col span={{ base: 12, sm: 6, md: 4}}>
                  <TextInput
                    label="Başlık/Note/Emanetci İsim Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6, md: 4}}>
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
                  valueData={raportStocUsedkData}
                  pdfColumns={pdfTableColumns}
                  type={2}
                  isMailDisabled={true}
                  isSmsDisabled={true}
                  isWhatsAppDisabled={true}
                  />
                  </Flex>
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Stok Emanetler({rowsTable?.length || 0})</Title>
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
        <StockUsedExpenseEdit
          ref={stockUsedExpenseEditRef} onSaveSuccess={handleSaveSuccess}
        ></StockUsedExpenseEdit>
        <StockUsedAdd
          ref={stockUsedAddRef} onSaveSuccess={handleSaveSuccess}
        ></StockUsedAdd>
      </Container>
  );
}
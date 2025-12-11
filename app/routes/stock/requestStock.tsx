import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Grid, Table, Text, Stack, Tooltip, Title, Button, Badge,
  Paper, TextInput, LoadingOverlay, Flex, Group, ActionIcon,
} from '@mantine/core';
import { MenuActionButton } from '../../components'
import { IconSearch, IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useWarehouseService } from '../../services/warehouseService';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import RequestStockAdd, { type RequestStockAddDialogControllerRef } from '../../components/stock/requestStockAdd';
import RequestStockEdit, { type RequestStockEditDialogControllerRef } from '../../components/stock/requestStockEdit';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
import { useAuth } from '~/authContext';
import { statuMockData } from '~/utils/priorityMockData';

interface RequestStockData {
  id: number;
  updateUserId: number;
  productId: number;
  updateUserFullName: string;
  createDate: string;
  productName: string;
  count: string;
  status: string;
  managerUserId: number;
  managerUserFullName: string;
  description?: string;
  managerNote?: string;
  requestDate?: string;
  approvedDate?: string;
  actions?: string;
}
interface Column {
  field: keyof RequestStockData;
  header: string;
}

export default function RequestStock() {
  const [requestStockData, setRequestStockData] = useState<RequestStockData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');

  const requestStockAddRef = useRef<RequestStockAddDialogControllerRef>(null);
  const requestStockEditRef = useRef<RequestStockEditDialogControllerRef>(null);
  const { currentUser } = useAuth();

  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'productName', header: 'Ürün Adı' },
    { field: 'count', header: 'Ürün Sayısı' },
    { field: 'status', header: 'Durum' },
    { field: 'updateUserFullName', header: 'Talep Eden' },
    { field: 'description', header: 'Açıklama Taleb edenin' },
    { field: 'managerUserFullName', header: 'Yönetici' },
    { field: 'managerNote', header: 'Yönetici Notu' },
    { field: 'requestDate', header: 'Taleb Tarih' },
    { field: 'createDate', header: 'İlk Kayıt' },
    { field: 'approvedDate', header: 'Onaylanma Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  useEffect(() => {
    setTimeout(() => {
        fetchShelves();
      }, 500);
  }, []);

  const fetchShelves = async () => {
    open();
    try {
      const currentUserId = currentUser.id as number || undefined;

      const getRequestStocks = await service.getRequestStocks(currentUserId);
      
      if (getRequestStocks) {
        
        setRequestStockData(getRequestStocks);
      } else {
        toast.info('Hiçbir veri yok!');
        setRequestStockData([]);
      }
    } catch (error: any) {
      toast.error(`Stok yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchShelves();
    }, 1500);
  };

  const handleDelete = async(item: RequestStockData) => {
     open();

    try {

      const newİtem = {
        id: item.id,
        count: parseInt(item.count, 10),
        description: item.description || '',
        productId: item.productId,
        status: 'canceled',
      }

      const result = await service.updatRequestStock(newİtem);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchShelves();
      
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
  const handleEdit = (value: RequestStockData) => {
    console.log("handleEdit", value);

    requestStockEditRef.current?.openDialog({
      ...value,
    });
  }

    // Filtrelenmiş veriler
  const filteredStocks = useMemo(() => {
    if (!searchText) return requestStockData;
    
    return requestStockData.filter(stock =>
      stock.productName.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      stock.updateUserFullName.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [requestStockData, searchText]);

  // raportdata
  const raportStockData = useMemo(() => {
    return filteredStocks.map((stock: RequestStockData) => ({
      ...stock,
      createDate: formatDate(stock.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredStocks])

  // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'requestDate' && col.field != 'description' && col.field != 'actions');

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
      col.field != 'requestDate' && col.field != 'description' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);

  const reportTitle = (): string => {
    return "İstek Taleb Raporu";
  }

  const diffStatuForColor = (statu: string) => {
    switch (statu) {
      case 'pending':
        return 'yellow';
      case 'canceled':
        return 'red';
      case 'approved':
        return 'green';
      default:
        return 'gray';
    }
  };

  const rowsTable = filteredStocks.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
     
        if (['createDate', 'requestDate', 'approvedDate'].includes(header.field)) {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? formatDate(item[header.field] as string ?? null, dateFormatStrings.dateTimeFormatWithoutSecond): "-"}
            </Table.Td>
          );
        }
        if (header.field === 'status') {
          return (
            <Table.Td key={header.field}>
              { 
              <Badge color={diffStatuForColor(item[header.field])}>
                {statuMockData.find(statu => statu.value === item[header.field])?.label || item[header.field]}
              </Badge>
              }
            </Table.Td>
          );
        }
        else if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <Tooltip label="Güncelle">
                <ActionIcon 
                  variant="light" 
                  color="blue"
                  disabled={item.status != "pending"}
                  onClick={() => handleEdit(item)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                </Tooltip>
                <Tooltip label="Sil">
                <ActionIcon 
                  variant="light" 
                  color="red"
                  disabled={item.status != "pending"}
                  onClick={() => handleDelete(item)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
                </Tooltip>
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
                <Title order={2}>Talebler Sayfası</Title>
                <Text size="sm" c="dimmed">
                  Toolbar Filtreleme Alanı
                </Text>
              </div>
              <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />} onClick={() => requestStockAddRef.current?.open()}>Yeni Ekle</Button>
              {/* Mobile için sadece icon buton */}
              <Button 
                variant="filled" 
                onClick={() => requestStockAddRef.current?.open()}
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
                    label="Ürün Ara"
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
                  valueData={raportStockData}
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
              <Title order={4}>Son Depo({rowsTable?.length || 0})</Title>
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
      <RequestStockAdd ref={requestStockAddRef} onSaveSuccess={handleSaveSuccess} />
      <RequestStockEdit ref={requestStockEditRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
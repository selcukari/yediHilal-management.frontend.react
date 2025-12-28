import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Grid, Table, Text, Stack, Tooltip, Title, Button, Badge,
  Paper, TextInput, LoadingOverlay, Flex, Group, ActionIcon,
} from '@mantine/core';
import { MenuActionButton } from '../../components'
import { IconSearch, IconPlus, IconEdit, IconFileTypePdf } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useWarehouseService } from '../../services/warehouseService';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import RequestStockAdd, { type RequestStockAddDialogControllerRef } from '../../components/stock/requestStockAdd';
import RequestStockEditManager, { type RequestStockEditManagerDialogControllerRef } from '../../components/stock/requestStockEditManager';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
import { statuMockData } from '~/utils/priorityMockData';
import { handleDownloadPdf, type RequestStockManagerDataPdf  } from '../../utils/repor/generateRequestStockPdf';
import { toast } from '../../utils/toastMessages';

interface RequestStockManagerData {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  createDate: string;
  productName: string;
  productId: number;
  count: string;
  status: string;
  managerUserId: number;
  note?: string;
  managerUserFullName: string;
  description?: string;
  managerNote?: string;
  requestDate?: string;
  approvedDate?: string;
  actions?: string;
}
interface Column {
  field: keyof RequestStockManagerData;
  header: string;
}

export default function RequestStock() {
  const [requestStockData, setRequestStockData] = useState<Record<string, RequestStockManagerData[]>>({});
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');

  const requestStockAddRef = useRef<RequestStockAddDialogControllerRef>(null);
  const requestStockEditManagerRef = useRef<RequestStockEditManagerDialogControllerRef>(null);

  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    // { field: 'id', header: 'Id' },
    { field: 'productName', header: 'Ürün Adı' },
    // { field: 'count', header: 'Ürün Sayısı' },
    { field: 'status', header: 'Durum' },
    { field: 'updateUserFullName', header: 'Talep Eden' },
    { field: 'description', header: 'Açıklama Taleb edenin' },
    { field: 'managerUserFullName', header: 'Yönetici' },
    { field: 'managerNote', header: 'Yönetici Notu' },
    { field: 'requestDate', header: 'Talep Tarih' },
    // { field: 'createDate', header: 'İlk Kayıt' },
    { field: 'approvedDate', header: 'Onaylanma Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  useEffect(() => {
    setTimeout(() => {
        fetchRequestStocks();
      }, 500);
  }, []);

  const fetchRequestStocks = async () => {
    open();
    try {
      const data = await service.getRequestStocks();

      setRequestStockData(data);

    } finally {
      close();
    }
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchRequestStocks();
    }, 1500);
  };

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

    // Filtrelenmiş veriler
  const filteredStocks = useMemo(() => {
    if (!searchText) return requestStockData;
  
    return Object.fromEntries(
      Object.entries(requestStockData)
      .map(([key, items]) => {
        const filteredItems = items.filter(item =>
          item.productName.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          item.updateUserFullName.toLowerCase().includes(searchText.trim().toLowerCase())
        );

        return [key, filteredItems];
      })
      .filter(([_, items]) => items.length > 0) // boş grupları at
  );
  }, [requestStockData, searchText]);

  // raportdata
  const raportStockData = useMemo(() => {
    // Her grubu tek bir satıra dönüştür
    const groupedStocks: RequestStockManagerData[] = [];
      
    Object.entries(filteredStocks).forEach(([groupId, groupItems]) => {
      if (groupItems.length === 0) return;
      
      const firstItem = groupItems[0];
      
      // Ürün adlarını ve count'ları birleştir
      const productList = groupItems.map(item => 
        `${item.productName} (${item.count})`
      ).join(', ');

      // managernote
      const totalManagernote = groupItems
        .map(item => item.managerNote || '')
        .filter(note => note.trim() !== '') // Boş notları filtrele
        .join(' - '); // "-" ile birleştir
  
      // status
      const totalStatus = groupItems
        .map(item => statuMockData.find(s => s.value === item.status)?.label || '')
        .filter(note => note.trim() !== '') // Boş notları filtrele
        .join(' - '); // "-" ile birleştir
      
      // Toplam count hesapla (eğer gerekliyse)
      const totalCount = groupItems.reduce((sum, item) => 
        sum + parseInt(item.count || '0', 10), 0
      );

      groupedStocks.push({
        ...firstItem,
        id: parseInt(groupId), // veya firstItem.id
        productName: productList,
        status: totalStatus || firstItem.status,
        count: totalCount.toString(), // veya groupItems.length.toString()
        managerNote: totalManagernote,
        requestDate: firstItem.requestDate 
          ? formatDate(firstItem.requestDate, dateFormatStrings.dateTimeFormatWithoutSecond)
          : "-",
        approvedDate: firstItem.approvedDate 
          ? formatDate(firstItem.approvedDate, dateFormatStrings.dateTimeFormatWithoutSecond)
          : "-",
        createDate: formatDate(firstItem.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
        // Diğer alanları da ekleyebilirsiniz
      });
    });
      return groupedStocks;
    }, [filteredStocks]);

  // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'id' && col.field != 'managerNote' && col.field != 'createDate' && col.field != 'note' && col.field != 'description' && col.field != 'actions');

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
      col.field != 'id' && col.field != 'managerNote' && col.field != 'createDate' && col.field != 'note' && col.field != 'description' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);

  const reportTitle = (): string => {
    return "İstek Talep Raporu";
  }

  const handleEdit = (value: RequestStockManagerData[]) => {

    requestStockEditManagerRef.current?.openDialog(value);
  }

  const handleDowlandPdf = (value: RequestStockManagerData[]) => {

    const pdfData: RequestStockManagerDataPdf = {
      name: 'İstek Talep Raporu',
      updateUserFullName: value[0].updateUserFullName,
      productNameWithCount: value.map(v => `${v.productName} (${v.count})`).join(', '),
      status: value.map(v => statuMockData.find(s => s.value === v.status)?.label || v.status).join(' - '),
      managerUserFullName: value[0].managerUserFullName,
      note: value.find(i => i.note)?.note, // Talep edenin notu genel
      description: value.map(v => v.description).filter(description => description && description.trim() !== '').join(' - '), // talep edenin notları birleştir
      managerNote: value.map(v => v.managerNote).filter(managerNote => managerNote && managerNote.trim() !== '').join(' - '), // Yöneticilerin notları birleştir
      requestDate: formatDate(value[0].requestDate, dateFormatStrings.dateTimeFormatWithoutSecond) || '',
      approvedDate: formatDate(value[0].approvedDate, dateFormatStrings.dateTimeFormatWithoutSecond) || '',
    };

    handleDownloadPdf(pdfData);
    toast.success('PDF başarıyla oluşturuldu!');
  }

  const rowsTable = Object.entries(requestStockData).map(
    ([requestStockId, items]) => {

      const firstItem = items[0];

      return (
        <Table.Tr key={`${requestStockId}-${firstItem.id}`}>

          {/* Ürünler */}
          <Table.Td>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {items.map(i => (
                <li key={i.id}>
                  {i.productName} ({i.count})
                </li>
              ))}
            </ul>
          </Table.Td>

          {/* Status */}
          <Table.Td>
            {
              items.map(i => (
                <Badge color={diffStatuForColor(i.status)} key={i.id}>
                  {statuMockData.find(s => s.value === i.status)?.label || i.status}
                </Badge>
              ))
            }
          </Table.Td>

          {/* TALEP EDEN */}
          <Table.Td>
            {firstItem.updateUserFullName}
          </Table.Td>

          {/* TALEP EDEN */}
          <Table.Td>
            {firstItem.note}
          </Table.Td>

          {/* yonetici */}
          <Table.Td>
            {firstItem.managerUserFullName}
          </Table.Td>

          {/* Manager Note */}
          <Table.Td>
            {(items || [])?.map(i => i.managerNote).filter(note => note && note.trim() !== '').join(' - ')}
          </Table.Td>
          {/* Talep Tarih */}
          <Table.Td>
            {formatDate(firstItem.requestDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
          </Table.Td>

          {/* Onaylanma Tarih */}
          <Table.Td>
            {formatDate(firstItem.approvedDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
          </Table.Td>

          {/* Actions */}
          <Table.Td>
            <Tooltip label="Onayla/Düzenle" withArrow>
            <ActionIcon
              color="green" disabled={!items.some(i => i.status === "pending")}
              onClick={() => handleEdit(items)}
            >
              <IconEdit size={16} />
            </ActionIcon>
            </Tooltip>
            <Tooltip label="PDF İndir">
            <ActionIcon 
              variant="light" 
              color="green"
              onClick={() => handleDowlandPdf(items)}>
              <IconFileTypePdf size={16} />
            </ActionIcon>
            </Tooltip>
          </Table.Td>
        </Table.Tr>
      );
    }
  );


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
                <Title order={2}>Talepler Sayfası</Title>
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
              <Title order={4}>Son Talebler({rowsTable?.length || 0})</Title>
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
      <RequestStockEditManager ref={requestStockEditManagerRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
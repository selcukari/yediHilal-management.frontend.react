import { useState, useEffect, Fragment, useRef, useMemo } from 'react';
import {
  Container, Grid, Table, Text, Stack, Title, Button,
  Paper, TextInput, LoadingOverlay, Flex, Group, ActionIcon,
} from '@mantine/core';
import { MenuActionButton } from '../../components'
import { IconSearch, IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useWarehouseService } from '../../services/warehouseService';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import ShelveAdd, { type ShelveAddDialogControllerRef } from '../../components/stock/shelveAdd';
import ShelveEdit, { type ShelveEditDialogControllerRef } from '../../components/stock/shelveEdit';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
import { useAuth } from '~/authContext';

interface ShelveData {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  createDate: string;
  name: string;
  rowsMax: number;
  columnsMax: number;
  updateDate: string;
  isActive: boolean;
  warehouseId: number;
  warehouseName: string;
  description?: string;
  actions?: string;
}
interface Column {
  field: keyof ShelveData;
  header: string;
}

export default function Stock() {
  const [shelveData, setShelveData] = useState<ShelveData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');

  const shelveAddRef = useRef<ShelveAddDialogControllerRef>(null);
  const shelveEditRef = useRef<ShelveEditDialogControllerRef>(null);
  const { currentUser } = useAuth();

  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Raf Adı' },
    { field: 'warehouseName', header: 'Depo Adı' },
    { field: 'rowsMax', header: 'Raf satır Adı' },
    { field: 'columnsMax', header: 'Raf sutün Adı' },
    { field: 'description', header: 'Açıklama' },
    { field: 'updateUserFullName', header: 'Günceleyen Kişi' },
    { field: 'createDate', header: 'İlk Kayıt' },
    { field: 'updateDate', header: 'Güncellenen Tarih' },
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
      const getStocks = await service.getShelves();
      
      if (getStocks) {
        
        setShelveData(getStocks);
      } else {
        toast.info('Hiçbir veri yok!');
        setShelveData([]);
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

  const handleDelete = async(id: number) => {
     open();

    try {

      const result = await service.deleteShelve(id);
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
  const handleEdit = (value: ShelveData) => {

    shelveEditRef.current?.openDialog({
      ...value,
      warehouseId: value.warehouseId.toString(),
    });
  }

    // Filtrelenmiş veriler
  const filteredStocks = useMemo(() => {
    if (!searchText) return shelveData;
    
    return shelveData.filter(stock =>
      stock.name.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      stock.updateUserFullName.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [shelveData, searchText]);

  // raportdata
  const raportStockData = useMemo(() => {
    return filteredStocks.map((stock: ShelveData) => ({
      ...stock,
      createDate: formatDate(stock.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
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
    return "Raf Raporu";
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
                  disabled={currentUser.roleId !== 1}
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
           {/* Sayfa Başlığı */}
            <Group justify="space-between" align="center">
              <div>
                <Title order={2}>Raflar Sayfası</Title>
                <Text size="sm" c="dimmed">
                  Toolbar Filtreleme Alanı
                </Text>
              </div>
              <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />} onClick={() => shelveAddRef.current?.open()}>Yeni Ekle</Button>
              {/* Mobile için sadece icon buton */}
              <Button 
                variant="filled" 
                onClick={() => shelveAddRef.current?.open()}
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
                    label="Raf adı veya Kullanıcı Ara"
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
      <ShelveAdd ref={shelveAddRef} onSaveSuccess={handleSaveSuccess} />
      <ShelveEdit ref={shelveEditRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
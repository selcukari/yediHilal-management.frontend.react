import { useState, useEffect, useMemo, useRef } from 'react';
import { differenceInDays } from 'date-fns';
import { omit } from 'ramda';
import {
  Container, Grid, TextInput, Text, Stack, Title, ActionIcon, Flex, Table, Group,
  Paper, Button, LoadingOverlay, Tooltip,
} from '@mantine/core';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from '../../utils/toastMessages';
import VehicleDepositAdd, { type VehicleDepositAddDialogControllerRef } from '../../components/vehicle/vehicleDepositAdd';
import VehicleDepositEdit, { type VehicleDepositEditDialogControllerRef } from '../../components/vehicle/vehicleDepositEdit';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useVehicleService } from '../../services/vehicleService';
import { MenuActionButton } from '../../components'
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
interface Column {
  field: keyof VehicleData;
  header: string;
}
interface VehicleData {
  id: number;
  givenToId: number;
  givenById: number;
  vehicleId: number;
  vehiclePlate: string;
  createDate: string;
  returnDate?: string;
  note?: string;
  isActive: boolean;
  givenToFullName: string;
  givenToPhone: string;
  givenByFullName: string;
  givenByPhone: string;
  actions?: string;
}

export default function VehicleDeposit() {
  const [vehicleDepositData, setVehicleDepositData] = useState<VehicleData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');

  const service = useVehicleService(import.meta.env.VITE_APP_API_VEHICLE_CONTROLLER);

  const vehicleDepositAdd = useRef<VehicleDepositAddDialogControllerRef>(null);
  const vehicleDepositEdit = useRef<VehicleDepositEditDialogControllerRef>(null);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'vehiclePlate', header: 'Araç Plaka' },
    { field: 'note', header: 'Not' },
    { field: 'givenToFullName', header: 'Araç Teslim Eden' },
    { field: 'givenByFullName', header: 'Araç Kullanan' },
    { field: 'createDate', header: 'İlk Kayıt' },
    { field: 'returnDate', header: 'Teslim Tarih' },
  ]);

  // Filtrelenmiş veriler
  const filteredVehicleDeposits = useMemo(() => {
    if (!searchText) return vehicleDepositData;
    
    return vehicleDepositData.filter(vehicleDeposit => {
      const matchesSearch = searchText 
        ? (vehicleDeposit.vehiclePlate.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          vehicleDeposit.givenByFullName.toLowerCase().includes(searchText.trim().toLowerCase()))
        : true;

      return matchesSearch;
    });
  }, [vehicleDepositData, searchText]);

  useEffect(() => {
    setTimeout(() => {
        fetchVehicleDeposit();
      }, 1000);
  }, []);
  const diffDateTimeForColor = (date?: string) => {
    if (!date) return "red"; // Tarih yoksa kırmızı döner, teslin tarihi 30 gecer ise red
    const daysDiff = differenceInDays(new Date(), date);

    if (daysDiff > 30) return "red";

    if (daysDiff > 15) return "orange";
    return "green";
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchVehicleDeposit();
    }, 1500);
  };

  const handleEdit = (item: VehicleData) => {
    vehicleDepositEdit.current?.openDialog({
      ...omit(['isActive', 'givenByFullName', 'givenToFullName', 'givenToPhone', 'givenByPhone'], item),
      note: item.note ? item.note : "",
      givenById: item.givenById ? item.givenById.toString() : "",
      vehicleId: item.vehicleId ? item.vehicleId.toString() : null,
    });
  }
  const handleDelete = async (id: number) => {
    open();

    try {

      const result = await service.deleteVehicleDeposit(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchVehicleDeposit();
      
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
  const fetchVehicleDeposit = async () => {
    open();
    try {
      const getVehicleDeposits = await service.getVehicleDeposits();
      
      if (getVehicleDeposits) {
        setVehicleDepositData(getVehicleDeposits);
      
      } else {
        toast.info('Hiçbir veri yok!');
        setVehicleDepositData([]);
      }
    } catch (error: any) {
      toast.error(`Vehicles yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };
   // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders;

    return newCols.map(col => ({
      key: col.field,
      title: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
      width: calculateColumnWidthMember(col.field) // Özel genişlik hesaplama fonksiyonu
    }));
  }, [rowHeaders]);
  const excelTableColumns = useMemo((): ColumnDefinition[] => {

    const newCols: Column[] = rowHeaders;

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);
  const reportTitle = (): string => {
    return "Araç Emanet/Zimbet Ürünler Raporu";
  }

  // raportdata
  const raportVehicleData = useMemo(() => {
    return filteredVehicleDeposits.map((vehicleDeposit: VehicleData) => ({
      ...vehicleDeposit,
      givenByFullName: `${vehicleDeposit.givenByFullName}(${vehicleDeposit.givenByPhone})`,
      createDate: formatDate(vehicleDeposit.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      returnDate: formatDate(vehicleDeposit.returnDate, dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredVehicleDeposits])

  const rowItems = filteredVehicleDeposits.map((vehicleDeposit: VehicleData) => (
    <Table.Tr key={vehicleDeposit.id}>
      <Table.Td>{vehicleDeposit.id}</Table.Td>
      <Table.Td>{vehicleDeposit.vehiclePlate}</Table.Td>
      <Table.Td>{vehicleDeposit.note}</Table.Td>
      <Table.Td>{`${vehicleDeposit.givenToFullName}(${vehicleDeposit.givenToPhone})`}</Table.Td>
      <Table.Td>{`${vehicleDeposit.givenByFullName}(${vehicleDeposit.givenByPhone})`}</Table.Td>
      <Table.Td style={{ color: diffDateTimeForColor(vehicleDeposit.createDate) }}>
          {formatDate(vehicleDeposit.createDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td>
        {formatDate(vehicleDeposit.returnDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Güncelle">
          <ActionIcon 
            variant="light" color="blue"
            disabled={vehicleDeposit.returnDate ? true : false}
            onClick={() => handleEdit(vehicleDeposit)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          </Tooltip>
          <Tooltip label="Sil">
          <ActionIcon 
            variant="light" color="red"
            disabled={vehicleDeposit.returnDate ? true : false}
            onClick={() => handleDelete(vehicleDeposit.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));


  const handleAddItem = () => {
   console.log("proje ekle");
    vehicleDepositAdd.current?.openDialog();
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
              <Title order={2}>Araç Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
              <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />}  onClick={handleAddItem}>Yeni Ekle</Button>
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
                    label="Plaka/Teslim Alan Kişi Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                 <Flex
                 mih={50} gap="md" justify="flex-end" align="flex-end" direction="row" wrap="wrap">
                 <MenuActionButton
                 reportTitle={reportTitle()}
                 excelColumns={excelTableColumns}
                 valueData={raportVehicleData}
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
            
        {/* Stok Formu */}
        <Paper shadow="xs" p="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>Son Emanet/Zimbet Araçlar({rowItems?.length || 0})</Title>
            <Table.ScrollContainer minWidth={400} maxHeight={700}>
              <Table striped highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Id</Table.Th>
                    <Table.Th>Araç Plaka</Table.Th>
                    <Table.Th>Note</Table.Th>
                    <Table.Th>Araç Teslim Eden</Table.Th>
                    <Table.Th>Araç Kullanan</Table.Th>
                    <Table.Th>Alınan Tarih</Table.Th>
                    <Table.Th>Teslim Tarih</Table.Th>
                    <Table.Th>İşlemler</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rowItems}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </Stack>
        <VehicleDepositAdd ref={vehicleDepositAdd} onSaveSuccess={handleSaveSuccess} />
        <VehicleDepositEdit ref={vehicleDepositEdit} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
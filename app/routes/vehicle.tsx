import { useState, useEffect, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import {
  Container, Grid, TextInput, Text, Stack, Title, RingProgress, ActionIcon,
  Paper, Button, LoadingOverlay, Flex, Table, Group, Select,
} from '@mantine/core';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from '../utils/toastMessages';
// import ItemAdd, { type ItemAddDialogControllerRef } from '../components/stock/stockAdd';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { useVehicleService } from '../services/vehicleService';
import { randaomColor } from '../utils/randaomColor';
import { MenuActionButton } from '../components'
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../utils/repor/calculateColumnWidth';
interface ProjectItem {
  name: string;
  key: string;
  count: number;
  color: string;
  value?: number;
  tooltip?: string;
}
interface Column {
  field: keyof VehicleData;
  header: string;
}
interface VehicleData {
  id: number;
  userId: number;
  userFullName: string;
  userPhone: string;
  createDate: string;
  updateDate?: string;
  status: boolean;
  plate: string;
  brand: string;
  model: string;
  engineNumber?: string;
  color?: string;
  mileage: number;
  note?: string;
  fuelType?: string; // yakıt tipi(Gasoline/Diesel/Electric/Hybrid)
  transmission?: string; //Manual/Automatic
  insuranceDate?: string; // sigortaTarih
  inspectionDate?: string; // muane tarihi
  year: number;
  actions?: string;
}

export default function Vehicle() {
  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [fuelTypes, setFuelTypes] = useState<{ value: string; label: string }[]>([]);
  const [transmissionTypes, setTransmissionTypes] = useState<{ value: string; label: string }[]>([]);
  const [transmissionType, setTransmissionType] = useState<string | null>('');
  const [fuelType, setfuelType] = useState<string | null>('');
  const [searchText, setSearchText] = useState('');

  const service = useVehicleService(import.meta.env.VITE_APP_API_VEHICLE_CONTROLLER);

  // const itemAddRef = useRef<ItemAddDialogControllerRef>(null);

    const [rowHeaders, setRowHeaders] = useState<Column[]>([
      { field: 'id', header: 'Id' },
      { field: 'plate', header: 'Plaka' },
      { field: 'brand', header: 'Marka' },
      { field: 'model', header: 'Model' },
      { field: 'year', header: 'Yıl' },
      { field: 'mileage', header: 'Kilometre' },
      { field: 'fuelType', header: 'Yakıt' },
      { field: 'transmission', header: 'Vites' },
      { field: 'color', header: 'Renk' },
      { field: 'engineNumber', header: 'Motor Numarası' },
      { field: 'inspectionDate', header: 'Muane Tarih' },
      { field: 'insuranceDate', header: 'Sigorta Tarih' },
    ]);

  const mockDataFuelTypes =[
    {id: "gasoline", name: "Benzin"},
    {id: "diesel", name: "Eizel"},
    {id: "electric", name: "Elektrik"},
    {id: "hybrid", name: "Melez"},
  ];
  const mockDataTransmissionTypes =[
    {id: "manual", name: "Manual"},
    {id: "automatic", name: "Otomatik"},];

  // Filtrelenmiş veriler
  const filteredVehicles = useMemo(() => {
    if (!searchText && !fuelType && !transmissionType) return vehicleData;
    
    return vehicleData.filter(vehicle => {
      const matchesSearch = searchText 
        ? (vehicle.plate.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          vehicle.model.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          vehicle.brand.toLowerCase().includes(searchText.trim().toLowerCase()))
        : true;
      
      const matchesFuelType = fuelType 
        ? vehicle.fuelType === fuelType
        : true;

      const matchesTransmissionType = transmissionType 
        ? vehicle.transmission === transmissionType
        : true;
      
      return matchesSearch && matchesFuelType && matchesTransmissionType;
    });
  }, [vehicleData, searchText, fuelType, transmissionType]);

  useEffect(() => {
    setTimeout(() => {
        fetchProject();
      }, 1000);
    setFuelTypes(
      mockDataFuelTypes.map((c: any) => ({
        value: c.id,
        label: c.name,
      }))
    );
    setTransmissionTypes(
      mockDataTransmissionTypes.map((c: any) => ({
        value: c.id,
        label: c.name,
      }))
    );
  }, []);

  const fetchProject = async () => {
    open();
    try {
      const getVehicles = await service.getVehicles();
      
      if (getVehicles) {
        setVehicleData(getVehicles);
      
      } else {
        toast.info('Hiçbir veri yok!');
        setVehicleData([]);
      }
    } catch (error: any) {
      toast.error(`Vehicles yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };
  const diffDateTimeForColor = (date?: string) => {
    if (!date) return "green";
    const daysDiff = differenceInDays(date, new Date());

    if (daysDiff > 7) return "green";

    if (new Date() >= new Date(date)) return "red";

    return "yellow";
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchProject();
    }, 1500);
  };

  const handleEdit = (item: VehicleData) => {
   console.log("handleEdit: item:", item);
  }
  const handleDelete = async (id: number) => {
    console.log("handleDelete: id:", id);
  }
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
    return "Araç Ürünler Raporu";
  }

  // raportdata
  const raportVehicleData = useMemo(() => {
    return filteredVehicles.map((vehicle: VehicleData) => ({
      ...vehicle,
      fuelType: fuelTypes.find((i)=> i.value == vehicle.fuelType)?.label,
      transmission: transmissionTypes.find((i)=> i.value == vehicle.transmission)?.label,
      inspectionDate: formatDate(vehicle.inspectionDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      insuranceDate: formatDate(vehicle.insuranceDate, dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredVehicles])

  const rowItems = filteredVehicles.map((vehicle: VehicleData) => (
    <Table.Tr key={vehicle.id}>
      <Table.Td>{vehicle.id}</Table.Td>
      <Table.Td>{vehicle.plate}</Table.Td>
      <Table.Td>{vehicle.brand}</Table.Td>
      <Table.Td>{vehicle.model}</Table.Td>
      <Table.Td>{vehicle.year}</Table.Td>
      <Table.Td>{vehicle.mileage}</Table.Td>
      <Table.Td>{fuelTypes.find((i)=> i.value == vehicle.fuelType)?.label}</Table.Td>
      <Table.Td>{transmissionTypes.find((i)=> i.value == vehicle.transmission)?.label}</Table.Td>
      <Table.Td>{vehicle.color}</Table.Td>
      <Table.Td>{vehicle.engineNumber}</Table.Td>
      <Table.Td>{vehicle.note}</Table.Td>
      <Table.Td>{`${vehicle.userFullName}(${vehicle.userPhone})`}</Table.Td>
      <Table.Td style={{ color: diffDateTimeForColor(vehicle.createDate) }}>
          {formatDate(vehicle.createDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td style={{ color: diffDateTimeForColor(vehicle.updateDate) }}>
        {formatDate(vehicle.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td style={{ color: diffDateTimeForColor(vehicle.inspectionDate) }}>
        {formatDate(vehicle.inspectionDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td style={{ color: diffDateTimeForColor(vehicle.insuranceDate) }}>
        {formatDate(vehicle.insuranceDate, dateFormatStrings.dateTimeFormatWithoutSecond)}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            variant="light" 
            color="blue"
            onClick={() => handleEdit(vehicle)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            color="red"
            onClick={() => handleDelete(vehicle.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const calculateTotal = () => {
    if (!vehicleData) return 0;
    return vehicleData.reduce((total, item) => total + item.mileage, 0);
  };

  const handleAddItem = () => {
   console.log("proje ekle");
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
          <Flex mih={50} gap="md" justify="center" align="center" direction="row" wrap="wrap">
            <RingProgress
              size={170}
              thickness={16}
              label={
                <Text size="xs" ta="center" px="xs" style={{ pointerEvents: 'none' }}>
                  Genel Toplam: {calculateTotal()}
                </Text>
              }
              sections={(vehicleData || []).map(vehicle => ({
                value: (vehicle.mileage / Math.max(calculateTotal(), 1)) * 100,
                color: randaomColor(),
                tooltip: `${vehicle.plate}: ${vehicle.mileage} km`,
              }))}
            />
          </Flex>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Araç Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
              <Button variant="filled" leftSection={<IconPlus size={14} />}  onClick={handleAddItem}>Yeni Ekle</Button>
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
                    label="Plaka/Marka/Model Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Select
                    label="Yakıt Tipi"
                    placeholder="yakıt Seçiniz"
                    data={fuelTypes}
                    searchable
                    clearable
                    maxDropdownHeight={200}
                    nothingFoundMessage="yakıt bulunamadı..."
                    onChange={(value) => setfuelType(value)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Select
                    label="Vites Tipi"
                    placeholder="vites Seçiniz"
                    data={transmissionTypes}
                    searchable
                    clearable
                    maxDropdownHeight={200}
                    nothingFoundMessage="vites bulunamadı..."
                    onChange={(value) => setTransmissionType(value)}
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
                  valueData={raportVehicleData}
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
            
        {/* Stok Formu */}
        <Paper shadow="xs" p="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>Son Araçlar({rowItems?.length || 0})</Title>
            <Table.ScrollContainer minWidth={400} maxHeight={700}>
              <Table striped highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Id</Table.Th>
                    <Table.Th>Plaka</Table.Th>
                    <Table.Th>Marka</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>Yıl</Table.Th>
                    <Table.Th>Kilometre</Table.Th>
                    <Table.Th>Yakıt</Table.Th>
                    <Table.Th>Vites</Table.Th>
                    <Table.Th>Renk</Table.Th>
                    <Table.Th>Motor Numarası</Table.Th>
                    <Table.Th>Note</Table.Th>
                    <Table.Th>Son Güncelleyen Kişi</Table.Th>
                    <Table.Th>İlk Kayıt</Table.Th>
                    <Table.Th>Son Güncelleme</Table.Th>
                    <Table.Th>Muane Tarihi</Table.Th>
                    <Table.Th>Sigorta Tarih</Table.Th>
                    <Table.Th>İşlemler</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rowItems}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </Stack>
        {/* <ItemAdd ref={itemAddRef} onSaveSuccess={handleSaveSuccess} /> */}
    </Container>
  );
}
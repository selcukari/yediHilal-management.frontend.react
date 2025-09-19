import { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, TextInput, Text, Stack, Title, RingProgress,
  Paper, Button, LoadingOverlay, Flex, Table, Group,
} from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from '../utils/toastMessages';
// import ItemAdd, { type ItemAddDialogControllerRef } from '../components/stock/stockAdd';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { useVehicleService } from '../services/vehicleService';

interface ProjectItem {
  name: string;
  key: string;
  count: number;
  color: string;
  value?: number;
  tooltip?: string;
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
  const [searchText, setSearchText] = useState('');

  const service = useVehicleService(import.meta.env.VITE_APP_API_VEHICLE_CONTROLLER);

  // const itemAddRef = useRef<ItemAddDialogControllerRef>(null);

  useEffect(() => {
    setTimeout(() => {
        fetchProject();
      }, 1000);
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

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchProject();
    }, 1500);
  };

  const elements = [
  { id: 6, count: 23, responsible: 'Ali',name: "Toplantı name test 1", createDate: "2025-08-31T13:52:20.289Z", finisDate: "2025-11-25T13:52:20.289Z"  },
  { id: 7, count: 17, responsible: 'Ahmet',name: "Toplantı name test 12", createDate: "2025-08-31T13:52:20.289Z", finisDate: "2025-11-25T13:52:20.289Z"  },
  { id: 39, count: 27, responsible: 'Fatma',name: "Toplantı name test 13", createDate: "2025-08-31T13:52:20.289Z", finisDate: "2025-11-25T13:52:20.289Z"  },
  { id: 56, count: 47, responsible: 'Fırat',name: "Toplantı name test 14", createDate: "2025-08-31T13:52:20.289Z", finisDate: "2025-11-25T13:52:20.289Z"  },
  { id: 58, count: 48, responsible: 'Ayşe', name: "Toplantı name test 15", createDate: "2025-08-31T13:52:20.289Z", finisDate: "2025-11-25T13:52:20.289Z" },
];

  const rowItems = vehicleData.map((vehicle: VehicleData) => (
    <Table.Tr key={vehicle.id}>
      <Table.Td>{vehicle.id}</Table.Td>
      <Table.Td>{vehicle.plate}</Table.Td>
      <Table.Td>{vehicle.brand}</Table.Td>
      <Table.Td>{vehicle.model}</Table.Td>
      <Table.Td>{vehicle.year}</Table.Td>
      <Table.Td>{vehicle.mileage}</Table.Td>
      <Table.Td>{vehicle.fuelType}</Table.Td>
      <Table.Td>{vehicle.transmission}</Table.Td>
      <Table.Td>{vehicle.color}</Table.Td>
      <Table.Td>{vehicle.engineNumber}</Table.Td>
      <Table.Td>{vehicle.note}</Table.Td>
      <Table.Td>{`${vehicle.userFullName}(${vehicle.userPhone})`}</Table.Td>
      <Table.Td>{formatDate(vehicle.createDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>{formatDate(vehicle.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>{formatDate(vehicle.inspectionDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>{formatDate(vehicle.insuranceDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
    </Table.Tr>
  ));

  const calculateTotal = () => {
    if (!elements) return 0;
    return elements.reduce((total, item) => total + item.count, 0);
  };

  const handleAddItem = () => {
   console.log("proje ekle");
  }

  const randaomColor = () => {
    const colors = ["dark", "gray", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"];
    const index = Math.floor(Math.random() * colors.length);

    return colors[index];
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
              sections={(elements || []).map(item => ({
                value: (item.count / Math.max(calculateTotal(), 1)) * 100,
                color: randaomColor(),
                tooltip: `${item.name}: ${item.count}`
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
                    label="Araç Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4} offset={3}>
                <Flex mih={50} gap="md" justify="flex-end" align="flex-end" direction="row" wrap="wrap">
                <Button variant="filled" leftSection={<IconPlus size={14} />}  onClick={handleAddItem}>Yeni Ekle</Button>
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
                    <Table.Th>Klometre</Table.Th>
                    <Table.Th>Yakıt</Table.Th>
                    <Table.Th>Vites Türü</Table.Th>
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
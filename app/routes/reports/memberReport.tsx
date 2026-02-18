import { useState, useMemo } from 'react';
import { IconSearch, IconCalendar, IconDownload, IconFilter } from '@tabler/icons-react';
import {
  Container,
  Grid,
  TextInput,
  Select,
  Stack,
  Group,
  Title,
  Text,
  Paper,
  Table,
  Button,
  Badge,
  LoadingOverlay,
  Pagination,
  Menu,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import 'dayjs/locale/tr';

// --- Mock Data & Types (Örnek Veriler) ---

type FilterModels = {
  searchText?: string;
  status?: string | null;
  dateRange?: [Date | null, Date | null];
};

interface MemberReportItem {
  id: number;
  fullName: string;
  branchName: string;
  provinceName: string;
  duty: string; // Görev
  status: string;
  phone: string;
  createDate: Date;
  finishDate?: Date;
}

// Örnek veri seti oluşturuyoruz
const MOCK_DATA: MemberReportItem[] = Array.from({ length: 25 }).map((_, index) => ({
  id: index + 1,
  fullName: `Üye Adı ${index + 1}`,
  branchName: `Şube ${Math.floor(index / 5) + 1}`,
  provinceName: ['İstanbul', 'Ankara', 'İzmir', 'Konya', 'Bursa'][index % 5],
  duty: index % 4 === 0 ? 'Başkan' : 'Üye',
  status: index % 3 === 0 ? 'Pasif' : 'Aktif',
  phone: `0555 ${100 + index} 22 33`,
  createDate: new Date(2024, 0, (index % 28) + 1),
  finishDate: index % 5 === 0 ? new Date(2024, 2, (index % 28) + 1) : undefined,
}));

const STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Pasif', label: 'Pasif' }
];

// --- Component ---

export default function MemberReport() {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterModels>({
    searchText: '',
    status: null,
    dateRange: [null, null]
  });
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  // Filtreleme Mantığı
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(item => {
      const matchesSearch = !filters.searchText || 
        item.fullName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        item.branchName.toLowerCase().includes(filters.searchText.toLowerCase());
      
      const matchesStatus = !filters.status || item.status === filters.status;
      
      const matchesDate = !filters.dateRange?.[0] || !filters.dateRange?.[1] || 
        (item.createDate >= filters.dateRange[0] && item.createDate <= filters.dateRange[1]);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [filters]);

  // Sayfalama Mantığı
  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, activePage]);

  const handleFilterChange = (key: keyof FilterModels, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActivePage(1); // Filtre değişince ilk sayfaya dön
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    setLoading(true);
    // Simüle edilmiş indirme işlemi
    setTimeout(() => {
      setLoading(false);
      alert(`${type.toUpperCase()} raporu başarıyla oluşturuldu.`);
    }, 800);
  };

  return (
    <Container size="xl" py="lg">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }} />
      
      <Stack gap="lg">
        {/* Başlık Alanı */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Üye Raporları</Title>
            <Text size="sm" c="dimmed">
              Sistemdeki üyelerin durumlarını, şubelerini ve detaylarını raporlayın.
            </Text>
          </div>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button leftSection={<IconDownload size={16} />} variant="filled" color="blue">
                Dışa Aktar
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Format Seçin</Menu.Label>
              <Menu.Item leftSection={<IconFilter size={14} />} onClick={() => handleExport('excel')}>
                Excel Olarak İndir
              </Menu.Item>
              <Menu.Item leftSection={<IconFilter size={14} />} onClick={() => handleExport('pdf')}>
                PDF Olarak İndir
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Filtreleme Kartı */}
        <Paper shadow="xs" p="lg" withBorder>
          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Arama"
                placeholder="İsim, şube vb. ara"
                leftSection={<IconSearch size={16} />}
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.currentTarget.value)}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Durum"
                placeholder="Tümü"
                data={STATUS_OPTIONS}
                clearable
                value={filters.status}
                onChange={(val) => handleFilterChange('status', val)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DatePickerInput
                type="range"
                label="Kayıt Tarihi Aralığı"
                placeholder="Tarih seçiniz"
                leftSection={<IconCalendar size={16} />}
                value={filters.dateRange}
                onChange={(val) => handleFilterChange('dateRange', val)}
                locale="tr"
                clearable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
               <Button 
                 fullWidth 
                 variant="light" 
                 color="red" 
                 onClick={() => setFilters({ searchText: '', status: null, dateRange: [null, null] })}
                 disabled={!filters.searchText && !filters.status && !filters.dateRange?.[0]}
               >
                 Filtreleri Temizle
               </Button>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Tablo Kartı */}
        <Paper shadow="xs" p="lg" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
               <Title order={4}>Sonuçlar ({filteredData.length})</Title>
            </Group>
            
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Ad Soyad</Table.Th>
                    <Table.Th>Şube</Table.Th>
                    <Table.Th>İl</Table.Th>
                    <Table.Th>Görev</Table.Th>
                    <Table.Th>Telefon</Table.Th>
                    <Table.Th>Durum</Table.Th>
                    <Table.Th>Kayıt Tarihi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>{item.id}</Table.Td>
                        <Table.Td style={{ fontWeight: 500 }}>{item.fullName}</Table.Td>
                        <Table.Td>{item.branchName}</Table.Td>
                        <Table.Td>{item.provinceName}</Table.Td>
                        <Table.Td>
                          <Badge variant="outline" color="blue">{item.duty}</Badge>
                        </Table.Td>
                        <Table.Td>{item.phone}</Table.Td>
                        <Table.Td>
                          <Badge color={item.status === 'Aktif' ? 'green' : 'gray'}>
                            {item.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{item.createDate.toLocaleDateString('tr-TR')}</Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={8} align="center">
                        <Text c="dimmed" py="xl">Kayıt bulunamadı</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Sayfalama */}
            <Group justify="flex-end" mt="md">
              <Pagination 
                total={Math.ceil(filteredData.length / itemsPerPage)} 
                value={activePage} 
                onChange={setActivePage} 
                color="pink"
              />
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

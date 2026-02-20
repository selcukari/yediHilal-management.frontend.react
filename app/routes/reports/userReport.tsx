import { useState, useMemo, useEffect } from 'react';
import { IconSearch, IconCalendar, IconDownload, IconFilter } from '@tabler/icons-react';
import {  Container,  Grid,  TextInput, Stack,  Group,  Title,  Text,  Paper,  Table,  Button,  Badge,  LoadingOverlay,  Pagination,  Menu,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import 'dayjs/locale/tr';
import { calculateColumnWidthUser } from '../../utils/repor/calculateColumnWidth';
import { type PdfConfig, type PdfTableColumn, PdfHelperService } from '../../utils/repor/exportToPdf';
import { toast } from '../../utils/toastMessages';
import { useReportService } from '../../services/memberReportService';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { formatDate } from '../../utils/formatDate';

type FilterModels = {
  searchText?: string;
  dateRange?: [Date | null, Date | null];
};
interface Column {
  field: string;
  header: string;
}
interface UserReportItem {
  id: number;
  fullName: string;
  branchName: string;
  provinceName: string;
  duty: string; // Görev
  createDate: Date;
  finishDate?: Date;
}

// --- Component ---
export default function UserReport() {
  const pdfHelperService = new PdfHelperService();
  
  const [loading, setLoading] = useState(false);
  const [updateDateReport, setUpdateDateReport] = useState("");
  const [userReportData, setUserReportData] = useState<UserReportItem[]>([]);
  const [filters, setFilters] = useState<FilterModels>({
    searchText: '',
    dateRange: [null, null]
  });
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'branchName', header: 'Alan' },
    { field: 'duty', header: 'Görevi' },
    { field: 'createDate', header: 'Oluşturulma Tarihi' },
  ]);

  const serviceReport = useReportService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const fetchUserReport = async () => {
    setLoading(true);
    try {
      const getUserReport = await serviceReport.getUserReport();
      // Burada gerçek veriyi state'e atabilirsiniz
      setUpdateDateReport(getUserReport.updateDate);
      if (getUserReport?.reportItems) {
        const mappedData = getUserReport.reportItems.map((item: any) => ({
          id: item.userId,
          fullName: item.userFullName,
          branchName: item.reportName,
          duty: item.dutyName,
          createDate: new Date(item.updateDate),
        }));
        setUserReportData(mappedData);
      }
        setLoading(false);
    } catch (error: any) {
        toast.error(`Kullanıcı raporu alınırken hata oluştu: ${error.message}`);
        setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchUserReport();
    }, 500);
  }, []);

  // Filtreleme Mantığı
  const filteredData = useMemo(() => {
    return userReportData?.filter(item => {
      const matchesSearch = !filters.searchText || 
        item.fullName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        item.branchName.toLowerCase().includes(filters.searchText.toLowerCase());

      const matchesDate = !filters.dateRange?.[0] || !filters.dateRange?.[1] || 
        (item.createDate >= new Date(filters.dateRange[0]) && item.createDate <= new Date(filters.dateRange[1]));

      return matchesSearch && matchesDate;
    });
  }, [filters, userReportData]);

  // Sayfalama Mantığı
  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, activePage]);

  const handleFilterChange = (key: keyof FilterModels, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActivePage(1); // Filtre değişince ilk sayfaya dön
  };

     // useMemo hook'u ile sütunları önbelleğe alıyoruz
    const pdfTableColumns = useMemo((): PdfTableColumn[] => {
  
      const newCols: Column[] = rowHeaders;
  
      return newCols.map(col => ({
        key: col.field,
        title: col.header,
        // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
        width: calculateColumnWidthUser(col.field) // Özel genişlik hesaplama fonksiyonu
      }));
    }, [rowHeaders]);

  const handleExport = (type: 'pdf') => {
    setLoading(true);
    const config: PdfConfig = {
      title: `YediHilal Kullanıcı Raporu`,
      fileName: `yediHilal-kullanici-raporu.pdf`,
      pageSize: 'a4',
      orientation: 'landscape',
      showCreationDate: true,
      showPagination: true,
      headerColor: '#3498db', // Mavi
      alternateRowColor: '#f8f9fa', // Açık gri
      textColor: '#2c3e50' // Koyu gri
    };

    const newData = filteredData?.map(item =>({
      ...item,
      createDate: item.createDate.toLocaleDateString('tr-TR'),
    }));
    
    pdfHelperService.generatePdf(newData, pdfTableColumns, config);

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
              Sistemdeki üyelerin durumlarını, şubelerini ve detaylarını raporlayın. {`Son güncelleme: ${formatDate(updateDateReport, dateFormatStrings.dateTimeFormatWithoutSecond)}`}
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
                    <Table.Th>Alan</Table.Th>
                    <Table.Th>Görevi</Table.Th>
                    <Table.Th>Kayıt Tarihi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData?.map((item, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{item.id}</Table.Td>
                        <Table.Td style={{ fontWeight: 500 }}>{item.fullName}</Table.Td>
                        <Table.Td>{item.branchName}</Table.Td>
                        <Table.Td>
                          <Badge variant="outline" color="blue">{item.duty}</Badge>
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

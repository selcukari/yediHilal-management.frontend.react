import { useState, useEffect, useMemo } from 'react';
import { IconSearch, IconCalendar } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Select, Stack, Group, Title, Text, Button, Paper, Table,
  Badge, LoadingOverlay, Flex,
} from '@mantine/core';
import { isEmpty } from 'ramda';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Province, MenuActionButton } from '../../../components'
import { useUniversityBranchReportForHeadService } from '../../../services/universityBranchReportForHeadService';
import { useProvinceService } from '../../../services/provinceService';
import { toast } from '../../../utils/toastMessages';
import { formatDate } from '../../../utils/formatDate';
import { dateFormatStrings } from '../../../utils/dateFormatStrings';
import { type PdfTableColumn } from '../../../utils/repor/exportToPdf';
import { calculateColumnWidthUser } from '../../../utils/repor/calculateColumnWidth';
import { type ColumnDefinition, type ValueData } from '../../../utils/repor/exportToExcel';
import { DayRenderer } from '../../../components';

type filterModels = {
  provinceIds?: string[] | null;
  userDutyIds?: string[] | null;
  searchText?: string;
  statu?: string | null;
  dateRange?: [string | null, string | null];
}
interface Column {
  field: string;
  header: string;
}
interface BranchReportForHeadType {
  id: number;
  universityName: string;
  branchHeads: string;
  branchHeadsConvert: any[];
  actions?: any
}
type BranchHeadDataType = {
  id: string;
  fullName: string;
  phone: string;
  provinceId: number;
  isActive: string;
  actions?: any
  statu: string;
  createDate: string;
  finisDate?: string | null;
}

export default function HeadReport() {
  const [branchHeadData, setBranchHeadData] = useState<BranchHeadDataType[]>([]);
  const [filterModel, setFilterModel] = useState<filterModels>({});
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'provinceName', header: 'İl' },
    { field: 'phone', header: 'Telefon' },
    { field: 'createDate', header: 'Görev Tarihi' },
    { field: 'finisDate', header: 'Bitiş Tarihi' },

    { field: 'universityName', header: 'Üniversite Adı' },
  ]);

  const mockDataStatus =[
    {id: "1", name: "Aktif"},
    {id: "2", name: "Pasif"}
  ];

  const serviceProvince = useProvinceService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const service = useUniversityBranchReportForHeadService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const onProvinceChange = (provinceValues: string[] | null): void => {

    setFilterModel((prev) => ({
      ...prev,
      provinceIds: provinceValues,
    }));
  };

  const fetchBranch = async () => {
     open();
  
     try {
  
      const getBranchReportForHeads = await service.getUniversityBranchReportForHeads();
      if (getBranchReportForHeads) {
        const resultData = getBranchReportForHeads.map((branchReportForHead: BranchReportForHeadType) => ({
          ...branchReportForHead,
          branchHeadsConvert: (() => {
              try {
                return JSON.parse(branchReportForHead.branchHeads ?? "");
              } catch {
                return null;
              }
            })()
        }));

        // resultData kullanarak
        const branchHeadData = resultData
          .filter((branch: BranchReportForHeadType) => branch.branchHeadsConvert && Array.isArray(branch.branchHeadsConvert))
          .flatMap((branch: any) => 
            branch.branchHeadsConvert?.map((sancaktar: any) => ({
              // sube başkan info
              ...sancaktar,
              statu: sancaktar.isActive == "1" ? "1" : "2",
              universityBranchInfo: {
                universityName: branch.universityName,
              }
            }))
          );

        setBranchHeadData(branchHeadData);
      } else {
        toast.info('Hiçbir veri yok!');
  
        setBranchHeadData([]);
      }
        close();
  
    } catch (error: any) {
        toast.error(`getDuties yüklenirken hata: ${error.message}`);
      close();
    }
  };
  const fetchProvinceData = async (countryId: string) => {
    try {

      const getProvinces = await serviceProvince.getProvinces(countryId);
      if (getProvinces) {
        setProvinces(
          getProvinces.map((c: any) => ({
            id: String(c.id),
            name: c.name,
          }))
        );

      } else {
        console.error('No getProvinces data found');
      }
    } catch (error: any) {
      console.error('Error fetching getProvinces:', error.message);
    }
  }

  useEffect(() => {
      setTimeout(() => {
        fetchBranch();
        fetchProvinceData("1"); // turkiye
      }, 500);
  }, []);

   // Filtrelenmiş toplantı verileri
  const filteredBranchReports = useMemo(() => {
    if (isEmpty(filterModel)) return branchHeadData;
    
    return branchHeadData.filter(branchData => {
      const matchesSearch = filterModel.searchText ? (
        branchData.fullName.toLowerCase().includes(filterModel.searchText.toLowerCase())
        ) : true;
  
      const matchesProvince = filterModel.provinceIds && filterModel.provinceIds.length > 0
        ? filterModel.provinceIds.includes(branchData.provinceId.toString())
        : true;

      const matchesStatu = filterModel.statu ? (
         filterModel.statu == branchData.statu)
        : true;
      
       // Date range filtresi
      const matchesDateRange = filterModel.dateRange ? (() => {
        const [startDate, endDate] = filterModel.dateRange;
        
        const branchCreateDate = new Date(branchData.createDate);
        
        // Start date kontrolü (startDate varsa)
        const afterStart = startDate ? branchCreateDate >= new Date(startDate) : true;
        
        // End date kontrolü (endDate varsa) - end date'in sonuna kadar (23:59:59)
        const beforeEnd = endDate ? branchCreateDate <= new Date(endDate + 'T23:59:59.999Z') : true;
        
        return afterStart && beforeEnd;
      })() : true;
  
      return matchesSearch && matchesProvince && matchesDateRange && matchesStatu;
    });
  }, [branchHeadData, filterModel]);

  const getProvinceName = (provinceId: string) => {
    const province = provinces?.find(i => i.id == provinceId);

    return province?.name;
  }

  const rowsTable = filteredBranchReports?.map((item: any, index) => (
    <Table.Tr key={index}>
      {rowHeaders.map((header) => {
        if (header.field === 'provinceName') {
          return (
            <Table.Td key={header.field}>
              {item["provinceId"] ? getProvinceName(item["provinceId"]): ""}
            </Table.Td>
          );
        }
        if (header.field === 'createDate') {
          return (
            <Table.Td key={header.field}>
              {item["createDate"] ? formatDate(item["createDate"], dateFormatStrings.dateTimeFormatWithoutSecond): ""}
            </Table.Td>
          );
        }
        if (header.field === 'finisDate') {
          return (
            <Table.Td key={header.field}>
              {item["finisDate"] ? formatDate(item["finisDate"], dateFormatStrings.dateTimeFormatWithoutSecond): ""}
            </Table.Td>
          );
        }
        if (header.field === 'universityName') {
          return (
            <Table.Td key={header.field}>
              {item["universityBranchInfo"]["universityName"] || ""}
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


 // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const excelTableColumns = useMemo((): ColumnDefinition[] => {

    const newCols: Column[] = rowHeaders;

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);

  const reportTitle = (): string => {
    return "Üniversite Başkan Görevli Rapor";
  };

   // raportdata
  const raportBranchData = useMemo(() => {
    return filteredBranchReports.map((report: any) => ({
      ...report,
      universityName: report["universityBranchInfo"]["universityName"] || "",
      provinceName: report["provinceId"] ? getProvinceName(report["provinceId"]): "",
      createDate: formatDate(report["createDate"], dateFormatStrings.dateTimeFormatWithoutSecond),
      finisDate: formatDate(report["finisDate"], dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredBranchReports])

  return (
      <Container size="xl">
        <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }}/>
        <Stack gap="lg">
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Üniversite Başkan Görevli Rapor Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
          </Group>

          {/* İçerik Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Province onProvinceChange={onProvinceChange}/>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3}}>
                  <TextInput
                    label="Görevli ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    onChange={(event) => setFilterModel(prev => ({
                      ...prev,
                      searchText: event.currentTarget?.value}))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3}}>
                  <DatePickerInput type="range" label="Tarih aralığını seç" placeholder="tarih aralığını seç" leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
                    clearable locale="tr" renderDay={DayRenderer}
                    onChange={(value) => setFilterModel(prev => ({
                      ...prev,
                      dateRange: value}))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Select
                    label="Görev Durumu"
                    placeholder="durum Seçiniz"
                    data={mockDataStatus.map(item => ({ value: item.id, label: item.name }))}
                    clearable maxDropdownHeight={200}
                    nothingFoundMessage="durum bulunamadı..."
                    onChange={(event) => {
                      setFilterModel(prev => ({
                      ...prev,
                      statu: event
                    }))}}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 5, sm: 4, md: 2}}>
                  <Flex mih={50} gap="md" justify="flex-start"
                    align="flex-end" direction="row" wrap="wrap">
                    <MenuActionButton
                    reportTitle={reportTitle()}
                    excelColumns={excelTableColumns}
                    valueData={raportBranchData}
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
              <Title order={4}>Son Görevliler({rowsTable?.length || 0})</Title>
              <Table.ScrollContainer minWidth={500} maxHeight={700}>
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
        {/* Dialoglar */}
      </Container>
  );
}
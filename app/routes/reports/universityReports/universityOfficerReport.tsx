import { useState, useEffect, useMemo } from 'react';
import { IconSearch, IconCalendar } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Select, Stack, Group, Title, Text, Button, Paper, Table,
  Badge, LoadingOverlay, Flex,
} from '@mantine/core';
import { isEmpty } from 'ramda';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Province, MenuActionButton, UserDuty } from '../../../components'
import { useUniversityBranchService } from '../../../services/universityBranchService';
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
interface UniversityBranchType {
  id: number;
  universityName: string;
  provinceId: number;
  provinceName: string;
  branchHeadId: number;
  universityBranchHeadFullName?: string | null;
  universityBranchHeadPhone?: string | null;
  email?: string | null;
  branchSancaktars?: string | null;
  socialMedias?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  isActive: boolean;
  actions?: any
}
type SancaktarDataGorevatama = {
  memberId: string;
  memberFullName: string;
  memberPhone?: string | null;
  branchDutyName: string;
  branchDutyId: string;
  isActive: string;
  actions?: any
  createDate: string;
  branchInfo: any;
  userDutyId: number;
  memberStatu: string;
}

export default function OfficerReport() {
  const [sancaktarUserData, setSancaktarUserData] = useState<SancaktarDataGorevatama[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null | undefined>(null);
  const [filterModel, setFilterModel] = useState<filterModels>({});
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState([
    { field: 'memberId', header: 'Id' },
    { field: 'memberFullName', header: 'Ad Soyad' },
    { field: 'memberStatu', header: 'Görev Durumu' },
    { field: 'userDutyName', header: 'Görevi' },
    { field: 'memberPhone', header: 'Telefon' },
    { field: 'createDate', header: 'Görev Tarihi' },

    { field: 'universityName', header: 'Üniversite Adı' },
    { field: 'universityBranchProvince', header: 'Üniversite İl' },
    { field: 'universityBranchHeadFullName', header: 'Üniversite Başkanı' },
    { field: 'universityBranchHeadPhone', header: 'Üniversite Baş. Numarası' },
  ]);

  const mockDataStatus =[
    {id: "1", name: "Aktif"},
    {id: "2", name: "Pasif"}
  ];

  const service = useUniversityBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const renderBoolean = (value: boolean) => {
    return (
      <Badge color={value ? 'green' : 'red'}>
        {value ? 'Evet' : 'Hayır'}
      </Badge>
    );
  };

  const onProvinceChange = (provinceValues: string[] | null): void => {

    setFilterModel((prev) => ({
      ...prev,
      provinceIds: provinceValues,
    }));
  };

  const onUserDutyChange = (provinceValues: string[] | null): void => {

    setFilterModel((prev) => ({
      ...prev,
      userDutyIds: provinceValues,
    }));
  };

  const fetchBranch = async () => {
     open();
  
     try {
  
      const getBranches = await service.getUniversityBranches();
      if (getBranches) {
        const resultData =getBranches.map((branch: UniversityBranchType) => ({
          ...branch,
          createDate: branch.createDate ? formatDate(branch.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
          branchSancaktars: (() => {
              try {
                return JSON.parse(branch.branchSancaktars ?? "");
              } catch {
                return null;
              }
            })()
        }));

        // resultData kullanarak
        const sancaktarData = resultData
          .filter((branch: UniversityBranchType) => branch.branchSancaktars && Array.isArray(branch.branchSancaktars))
          .flatMap((branch: any) => 
            branch.branchSancaktars?.map((sancaktar: any) => ({
              ...sancaktar,
              memberStatu: sancaktar.isActive == "1" ? "1" : "2",
              branchInfo: {
                id: branch.id,
                universityName: branch.universityName,
                provinceName: branch.provinceName,
                provinceId: branch.provinceId,
                email: branch.email,
                // sube başkan info
                universityBranchHeadFullName: branch.branchHeadFullName,
                branchHeadId: branch.branchHeadId,
                universityBranchHeadPhone: branch.branchHeadPhone
              }
            }))
          );

        setSancaktarUserData(sancaktarData);
      } else {
        toast.info('Hiçbir veri yok!');
  
        setSancaktarUserData([]);
      }
        close();
  
    } catch (error: any) {
        toast.error(`getDuties yüklenirken hata: ${error.message}`);
      close();
    }
  };

  useEffect(() => {
      setTimeout(() => {
        fetchBranch();
      }, 500);
  }, []);

   // Filtrelenmiş toplantı verileri
  const filteredBranchReports = useMemo(() => {
    if (isEmpty(filterModel)) return sancaktarUserData;
    
    return sancaktarUserData.filter(branchData => {
      const matchesSearch = filterModel.searchText ? (
        branchData.memberFullName.toLowerCase().includes(filterModel.searchText.toLowerCase())
        ) : true;
  
      const matchesProvince = filterModel.provinceIds && filterModel.provinceIds.length > 0
        ? filterModel.provinceIds.includes(branchData.branchInfo.provinceId.toString())
        : true;

      const matchesUserDuty = filterModel.userDutyIds && filterModel.userDutyIds.length > 0
        ? filterModel.userDutyIds.includes(branchData.userDutyId.toString())
        : true;
      
      const matchesStatu = filterModel.statu ? (
         filterModel.statu == branchData.memberStatu)
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
  
      return matchesSearch && matchesProvince && matchesUserDuty && matchesStatu && matchesDateRange;
    });
  }, [sancaktarUserData, filterModel]);

  const rowsTable = filteredBranchReports?.map((item: any) => (
    <Table.Tr key={item.memberId}>
      {rowHeaders.map((header) => {
        if (header.field === 'createDate') {
          return (
            <Table.Td key={header.field}>
              {item["createDate"] ? formatDate(item["createDate"], dateFormatStrings.dateTimeFormatWithoutSecond): ""}
            </Table.Td>
          );
        }
        if (header.field === 'universityName') {
          return (
            <Table.Td key={header.field}>
              {item["branchInfo"]["universityName"] || ""}
            </Table.Td>
          );
        }
        if (header.field === 'universityBranchProvince') {
          return (
            <Table.Td key={header.field}>
              {item["branchInfo"]["provinceName"] || ""}
            </Table.Td>
          );
        }
        if (header.field === 'universityBranchHeadFullName') {
          return (
            <Table.Td key={header.field}>
              {item["branchInfo"]["universityBranchHeadFullName"] || ""}
            </Table.Td>
          );
        }
        if (header.field === 'universityBranchHeadPhone') {
          return (
            <Table.Td key={header.field}>
              {item["branchInfo"]["universityBranchHeadPhone"] || ""}
            </Table.Td>
          );
        }
        if (header.field === 'memberStatu') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field] == "1")}
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
    return "Üniversite Görevli Rapor";
  };

   // raportdata
  const raportBranchData = useMemo(() => {
    return filteredBranchReports.map((report: any) => ({
      ...report,
      universityName: report["branchInfo"]["universityName"] || "",
      universityBranchProvince: report["branchInfo"]["provinceName"] || "",
      universityBranchHeadFullName: report["branchInfo"]["universityBranchHeadFullName"] || "",
      universityBranchHeadPhone: report["branchInfo"]["universityBranchHeadPhone"] || "",
      memberStatu: report["memberStatu"] == "1" ? "Evet" : "Hayır",
      createDate: formatDate(report["createDate"], dateFormatStrings.dateTimeFormatWithoutSecond),
    }))
  }, [filteredBranchReports])

  return (
      <Container size="xl">
        <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }}/>
        <Stack gap="lg">
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Üniversite Görevli Rapor Sayfası</Title>
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
                  <Province onProvinceChange={onProvinceChange} countryId={selectedCountry}/>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <UserDuty onUserDutyChange={onUserDutyChange}></UserDuty>
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
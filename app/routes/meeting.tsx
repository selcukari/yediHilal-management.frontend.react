import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Grid, TextInput, Text, Stack, Title, RingProgress,Badge,
  Paper, Button, LoadingOverlay, Flex, Table, Group, ActionIcon,
} from '@mantine/core';
import { differenceInDays } from 'date-fns';
import { IconSearch, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from '../utils/toastMessages';
import { useMeetingService } from '../services/meetingService';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import MeetingAdd, { type MeetingAddDialogControllerRef } from '../components/meeting/meetingAdd';
import MeetingEdit, { type MeetingEditDialogControllerRef } from '../components/meeting/meetingEdit';
import { randaomColor } from '../utils/randaomColor';
import { MenuActionButton , Province} from '../components'
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../utils/repor/calculateColumnWidth';
import { stripHtml } from '../utils/stripHtml';
interface MeetingData {
  id: number;
  name: string;
  agendas?: string;
  address?: string;
  participantCount?: number;
  meetingTypeId: number;
  meetingTypeName: string;
  provinceId: number;
  provinceName: string;
  duration?: number;
  notes?: string;
  isActive: boolean;
  responsibleId: number;
  responsibleFullName: string;
  createDate: string;
  UpdateDate?: string;
  time?: string;
}
interface Column {
  field: keyof MeetingData;
  header: string;
}

export default function Meeting() {
  const [meetingData, setMeetingData] = useState<MeetingData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');
  const [filterProvinceIds, setFilterProvinceIds] = useState<string[] | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("1");

  const meetingAddRef = useRef<MeetingAddDialogControllerRef>(null);
  const meetingEditRef = useRef<MeetingEditDialogControllerRef>(null);

  const service = useMeetingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Toplantı Adı' },
    { field: 'provinceName', header: 'İl' },
    { field: 'agendas', header: 'Gündemler' },
    { field: 'participantCount', header: 'Katılımcı Sayısı' },
    { field: 'responsibleFullName', header: 'Sorumlu' },
    { field: 'meetingTypeName', header: 'Toplantı Birim' },
    { field: 'address', header: 'Adres' },
    { field: 'time', header: 'Toplantı Tarihi' },
    { field: 'duration', header: 'Toplantı Süresi(saat)' },
    { field: 'createDate', header: 'İlk Kayıt T.' },
  ]);

  useEffect(() => {
    setTimeout(() => {
      fetchProject();
    }, 1000);
  }, []);

  const fetchProject = async () => {
    open();
    try {

      const getMeetings = await service.getMeetings();
      
      if (getMeetings) {
        setMeetingData(getMeetings)
      
      } else {
        toast.info('Hiçbir veri yok!');
        setMeetingData([]);
      }
    } catch (error: any) {
      toast.error(`Stok yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const handleEdit = (value: MeetingData) => {
    meetingEditRef.current?.openDialog({
      ...value,
      provinceId: value.provinceId?.toString(),
      meetingTypeId: value.meetingTypeId?.toString(),
      participantCount: value.participantCount ?? 1,
      agendas: value.agendas ?? "",
      time: value.time ?? "",
    });
  };
  const handleDelete = async (id: number) => {
    open();

    try {

      const result = await service.deleteMeeting(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchProject();
      
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
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchProject();
    }, 1500);
  };
  const diffDateTimeForColor = (date?: string) => {
    if (!date) return "green";

    const daysDiff = differenceInDays(date, new Date());

    if (daysDiff > 7) return "green";

    if (new Date() >= new Date(date)) return "red";

    return "yellow";
  };

  const onProvinceChange = (provinceValues: string[] | null): void => {
    setFilterProvinceIds(provinceValues);
  };

  // Filtrelenmiş toplantı verileri
  const filteredMeetings = useMemo(() => {
    if (!searchText && !filterProvinceIds) return meetingData;
    
    return meetingData.filter(meeting => {
      const matchesSearch = searchText ? (
        meeting.name.toLowerCase().includes(searchText.toLowerCase()) ||
        meeting.responsibleFullName?.toLowerCase().includes(searchText.toLowerCase())
        ) : true;

      const matchesProvince = filterProvinceIds && filterProvinceIds.length > 0
        ? filterProvinceIds.includes(meeting.provinceId.toString())
        : true;

      return matchesSearch && matchesProvince;
    });
  }, [meetingData, searchText, filterProvinceIds]);

  const rowItems = filteredMeetings.map((element) => {

    return (<Table.Tr key={element.id}>
      <Table.Td>{element.id}</Table.Td>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.provinceName}</Table.Td>
      <Table.Td>{element.agendas?.substring(0,30)}</Table.Td>
      <Table.Td>{element.participantCount}</Table.Td>
      <Table.Td>{element.responsibleFullName}</Table.Td>
      <Table.Td>{element.meetingTypeName}</Table.Td>
      <Table.Td>{stripHtml(element.notes)?.substring(0,20)}</Table.Td>
      <Table.Td>{element.duration}</Table.Td>
      <Table.Td>{formatDate(element.time, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>{formatDate(element.createDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            variant="light" 
            color="blue"
            onClick={() => handleEdit(element)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            color="red"
            disabled={(differenceInDays(element.time ?? new Date(), new Date())<0 ? true : false)}
            onClick={() => handleDelete(element.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>)
  });

  const calculateTotal = () => {
    if (meetingData.length < 0) return 0;
    return meetingData.reduce((total, item) => total + (item.participantCount ?? 0), 0);
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
    return "Toplantı Raporu";
  }

  // raportdata
  const raportProjectData = useMemo(() => {
    return filteredMeetings.map((project: MeetingData) => ({
      ...project,
      agendas: project.agendas?.substring(0,30),
      createDate: formatDate(project.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      time: project.time ? formatDate(project.time, dateFormatStrings.dateTimeFormatWithoutSecond) : '-',
    }))
  }, [filteredMeetings])

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
              sections={(meetingData || []).map(item => ({
                value: ((item.participantCount ?? 1) / Math.max(calculateTotal(), 1)) * 100,
                color: randaomColor(),
                tooltip: `${item.name}: ${item.participantCount}`
              }))}
            />
          </Flex>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Toplantı Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />}  onClick={() => meetingAddRef.current?.open()}>Yeni Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={() => meetingAddRef.current?.open()}
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
                    label="Toplantı Adı/Sorumlu Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Province onProvinceChange={onProvinceChange} countryId={selectedCountry}/>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
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
                  valueData={raportProjectData}
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
            <Title order={4}>Son Toplantılar({rowItems?.length || 0})</Title>
            <Table.ScrollContainer minWidth={400} maxHeight={700}>
              <Table striped highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Id</Table.Th>
                    <Table.Th>Toplantı Adı</Table.Th>
                    <Table.Th>İl</Table.Th>
                    <Table.Th>Gündemler</Table.Th>
                    <Table.Th>Katılımcı Sayısı</Table.Th>
                    <Table.Th>Sorumlu</Table.Th>
                    <Table.Th>Toplantı Türü</Table.Th>
                    <Table.Th>Alınan Kararlar</Table.Th>
                    <Table.Th>Toplantı Süresi(saat)</Table.Th>
                    <Table.Th>Toplantı Tarihi</Table.Th>
                    <Table.Th>İlk Kayıt Tarihi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rowItems}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </Stack>
      <MeetingAdd ref={meetingAddRef} onSaveSuccess={handleSaveSuccess} />
      <MeetingEdit ref={meetingEditRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
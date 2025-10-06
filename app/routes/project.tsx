import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Grid, TextInput, Text, Stack, Title, RingProgress,Badge,
  Paper, Button, LoadingOverlay, Flex, Table, Group, ActionIcon,
} from '@mantine/core';
import { IconSearch, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from '../utils/toastMessages';
import { useProjectService } from '../services/projectService';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { priorityMockData } from '../utils/priorityMockData';
import ProjectAdd, { type ProjectAddDialogControllerRef } from '../components/project/projectAdd';
import ProjectEdit, { type ProjectEditDialogControllerRef } from '../components/project/projectEdit';
import { randaomColor } from '../utils/randaomColor';
import { MenuActionButton } from '../components'
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../utils/repor/calculateColumnWidth';
import { useAuth } from '~/authContext';
import { stripHtml } from '../utils/stripHtml';
interface ProjectData {
  id: number;
  numberOfParticipant: number;
  note: string;
  name: string;
  priority: string;
  isActive: boolean;
  responsibleId: string;
  responsibleFullName: string;
  finisDate: string;
  createDate: string;
  budget?: number;
  fileUrls?: string;
}
interface Column {
  field: keyof ProjectData;
  header: string;
}

export default function Project() {
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const [searchText, setSearchText] = useState('');

  const projectAddRef = useRef<ProjectAddDialogControllerRef>(null);
  const projectEditRef = useRef<ProjectEditDialogControllerRef>(null);

  const service = useProjectService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const { currentUser } = useAuth();

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Proje Adı' },
    { field: 'numberOfParticipant', header: 'Katılımcı Sayısı' },
    { field: 'priority', header: 'Öncelik' },
    { field: 'responsibleFullName', header: 'Sorumlu' },
    { field: 'budget', header: 'Bütçe ₺' },
    { field: 'note', header: 'Note' },
    { field: 'createDate', header: 'Başlangıç T.' },
    { field: 'finisDate', header: 'Bitiş T.' }
  ]);

  useEffect(() => {
    setTimeout(() => {
        fetchProject();
      }, 1000);
  }, []);

  const fetchProject = async () => {
    open();
    try {

      const getProjects = await service.getProjects();
      
      if (getProjects) {
        setProjectData(getProjects)
      
      } else {
        toast.info('Hiçbir veri yok!');
        setProjectData([]);
      }
    } catch (error: any) {
      toast.error(`Stok yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const handleEdit = (value: ProjectData) => {
    projectEditRef.current?.openDialog({
      ...value,
      fileUrls: value.fileUrls,
      responsibleId: value.responsibleId.toString()
    });
  };
  const handleDelete = async (id: number) => {
    open();

    try {

      const result = await service.deleteProject(id);
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

   // Öncelik değerlerine göre renk döndüren fonksiyon
  const getPriorityColor = (priorityValue: string, isFinish: boolean) => {
    // Eğer iş tamamlandıysa her zaman gri döndür
    if (isFinish) {
      return 'gray';
    }
    switch(priorityValue) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Filtrelenmiş proje verileri
  const filteredProjects = useMemo(() => {
    if (!searchText) return projectData;
    
    return projectData.filter(project => 
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.responsibleFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      project.note?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [projectData, searchText]);

  const rowItems = filteredProjects.map((element) => {
    const priorityInfo = priorityMockData.find(x => x.value === element.priority);

    return (<Table.Tr key={element.id}>
      <Table.Td>{element.id}</Table.Td>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.numberOfParticipant}</Table.Td>
      <Table.Td>{ 
        <Badge 
            color={getPriorityColor(element.priority, !!element.finisDate)} 
            variant="filled"
          >
          {priorityInfo?.label || element.priority}
          </Badge>
      }</Table.Td>
      <Table.Td>{element.responsibleFullName}</Table.Td>
      <Table.Td>{element.budget}</Table.Td>
      <Table.Td>{stripHtml(element.note)?.substring(0,25)}</Table.Td>
      <Table.Td>{formatDate(element.createDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>{formatDate(element.finisDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            variant="light" 
            color="blue"
            disabled={(currentUser?.id.toString()) as string == element.responsibleId.toString() ? false : true}
            onClick={() => handleEdit(element)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            color="red"
            disabled={(currentUser?.id.toString()) as string == element.responsibleId.toString() ? (element.finisDate ? true : false) : true}
            onClick={() => handleDelete(element.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>)
  });

  const calculateTotal = () => {
    if (projectData.length < 0) return 0;
    return projectData.reduce((total, item) => total + item.numberOfParticipant, 0);
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
    return "Projeler Raporu"; 
  }

  // raportdata
  const raportProjectData = useMemo(() => {
    return filteredProjects.map((project: ProjectData) => ({
      ...project,
      createDate: formatDate(project.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      finisDate: project.finisDate ? formatDate(project.finisDate, dateFormatStrings.dateTimeFormatWithoutSecond) : '-',
      priority: priorityMockData.find(x => x.value === project.priority)?.label || project.priority
    }))
  }, [filteredProjects])

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
              sections={(projectData || []).map(item => ({
                value: (item.numberOfParticipant / Math.max(calculateTotal(), 1)) * 100,
                color: randaomColor(),
                tooltip: `${item.name}: ${item.numberOfParticipant}`
              }))}
            />
          </Flex>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Projeler Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />}  onClick={() => projectAddRef.current?.open()}>Yeni Ekle</Button>
                 {/* Mobile için sadece icon buton */}
                <Button 
                  variant="filled" 
                  onClick={() => projectAddRef.current?.open()}
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
                    label="Proje Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
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
            <Title order={4}>Son Projeler({rowItems?.length || 0})</Title>
            <Table.ScrollContainer minWidth={400} maxHeight={700}>
              <Table striped highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Id</Table.Th>
                    <Table.Th>Proje Adı</Table.Th>
                    <Table.Th>Katılımcı Sayısı</Table.Th>
                    <Table.Th>Öncelik</Table.Th>
                    <Table.Th>Sorumlu</Table.Th>
                    <Table.Th>Bütçe</Table.Th>
                    <Table.Th>Note</Table.Th>
                    <Table.Th>Başlangıç Tarih</Table.Th>
                    <Table.Th>Bitiş</Table.Th>
                    <Table.Th>İşlemler</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rowItems}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </Stack>
      <ProjectAdd ref={projectAddRef} onSaveSuccess={handleSaveSuccess} />
      <ProjectEdit ref={projectEditRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
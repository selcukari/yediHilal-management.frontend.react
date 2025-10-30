import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, ActionIcon, Stack, Group, Flex, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { omit } from 'ramda';
import { useDisclosure } from '@mantine/hooks';
import UniversityBranchAdd, { type UniversityBranchAddDialogControllerRef } from '../components/universityBranch/universiteBranchAdd';
import UniversityBranchEdit, { type UniversityBranchEditDialogControllerRef } from '../components/universityBranch/universityBranchEdit';
import { useUniversityBranchService } from '../services/universityBranchService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { MenuActionButton } from '../components'
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../utils/repor/calculateColumnWidth';
import { useAuth } from '~/authContext';

interface Column {
  field: keyof UniversityBranchType;
  header: string;
}

interface UniversityBranchType {
  id: number;
  universityName: string;
  provinceId: number;
  provinceName: string;
  branchHeadId: number;
  branchHeadFullName?: string | null;
  branchHeadPhone?: string | null;
  socialMedias?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  isActive: boolean;
  actions?: any
}

export default function Duty() {
  const [resultData, setResultData] = useState<UniversityBranchType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  const { currentUser } = useAuth();
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'universityName', header: 'Üniversite Adı' },
    { field: 'branchHeadFullName', header: 'Başkan Adı/Telefon' },
    { field: 'provinceName', header: 'İl' },
    { field: 'createDate', header: 'İlk Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  const universityBranchAddRef = useRef<UniversityBranchAddDialogControllerRef>(null);
  const universityBranchEditRef = useRef<UniversityBranchEditDialogControllerRef>(null);

  const service = useUniversityBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredBranchs = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(branch => branch.universityName.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchUniversityBranch();
    }, 1000);
  }, []);

  const isUserAdmin = useMemo(() => {
    return currentUser?.userType === 'userLogin';
  }, [currentUser]);

  const handleEdit = (item: UniversityBranchType) => {
    universityBranchEditRef.current?.openDialog({
      ...omit(['actions', 'createDate', 'branchHeadPhone', 'updateDate', 'provinceName', 'branchHeadFullName'], item),
      branchHeadId: item.branchHeadId ? item.branchHeadId.toString() : null,
      provinceId: item.provinceId?.toString(),
    });
  };

  const handleDelete = async (id: number) => {
    open();

     try {

      const result = await service.deleteUniversityBranch(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchUniversityBranch();
      
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

  const rowsTable = filteredBranchs.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'branchHeadFullName') {
          return (
            <Table.Td key={header.field}>
              {`${item[header.field]}(${item.branchHeadPhone || '-'})`}
            </Table.Td>
          );
        }
        if (header.field === 'actions') {
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
                  color="red" disabled={!isUserAdmin}
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

  const fetchUniversityBranch = async () => {
     open();

     try {
      const headId = !isUserAdmin ? currentUser.id as number : undefined;
      const getUniversityBranches = await service.getUniversityBranches(headId);
      if (getUniversityBranches) {
        setResultData(getUniversityBranches.map((UniversityBranch: UniversityBranchType) => ({
          ...UniversityBranch,
          createDate: UniversityBranch.createDate ? formatDate(UniversityBranch.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();

    } catch (error: any) {
        toast.error(`UniversityBranch yüklenirken hata: ${error.message}`);
      close();
    }
  };

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchUniversityBranch();
    }, 1000);
  };
  
  // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col => col.field !== 'actions');

    return newCols.map(col => ({
      key: col.field,
      title: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
      width: calculateColumnWidthMember(col.field) // Özel genişlik hesaplama fonksiyonu
    }));
  }, [rowHeaders]);
  const excelTableColumns = useMemo((): ColumnDefinition[] => {

    const newCols: Column[] = rowHeaders.filter(col => col.field !== 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);
  const reportTitle = (): string => {
    return "Üniversiteler Raporu";
  }

  // raportdata
  const raportVehicleData = useMemo(() => {
    return filteredBranchs.map((branch: UniversityBranchType) => ({
      ...branch,
      branchHeadFullName: `${branch.branchHeadFullName} (${branch.branchHeadPhone || '-'})`,
    }))
  }, [filteredBranchs])

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
              <Title order={2}>Üniversite Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />} onClick={() => universityBranchAddRef.current?.openDialog()}
              disabled={!isUserAdmin}>Yeni Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={() => universityBranchAddRef.current?.openDialog()}
              hiddenFrom="xs" disabled={!isUserAdmin}
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
                    label="Üniversite Ara"
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

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Üniversiteler({rowsTable?.length || 0})</Title>
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
        <UniversityBranchAdd ref={universityBranchAddRef} onSaveSuccess={handleSaveSuccess} />
        <UniversityBranchEdit ref={universityBranchEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
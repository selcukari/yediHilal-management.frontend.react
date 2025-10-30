import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Badge, Flex, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { omit } from 'ramda';
import { useDisclosure } from '@mantine/hooks';
import BranchAdd, { type BranchAddDialogControllerRef } from '../components/branch/branchAdd';
import BranchEdit, { type BranchEditDialogControllerRef } from '../components/branch/branchEdit';
import { useBranchService } from '../services/branchService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '~/authContext';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { MenuActionButton } from '../components'
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../utils/repor/calculateColumnWidth';

interface Column {
  field: keyof BranchType;
  header: string;
}

interface BranchType {
  id: number;
  branchName: string;
  provinceId: number;
  provinceName: string;
  branchHeadId: number;
  branchHeadFullName?: string | null;
  branchHeadPhone?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  rentalPrice?: number;
  isRent: boolean;
  isActive: boolean;
  actions?: any
}

export default function Branch() {
  const [resultData, setResultData] = useState<BranchType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  const { currentUser } = useAuth();
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'branchName', header: 'Şube Adı' },
    { field: 'branchHeadFullName', header: 'Başkan Adı/Telefon' },
    { field: 'provinceName', header: 'İl' },
    { field: 'phone', header: 'Telefon' },
    { field: 'email', header: 'Mail' },
    { field: 'openingDate', header: 'Acılış Tarih' },
    { field: 'isRent', header: 'Kiralık Mı' },
    { field: 'rentalPrice', header: 'Kira Miktarı' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  const branchAddRef = useRef<BranchAddDialogControllerRef>(null);
  const branchEditRef = useRef<BranchEditDialogControllerRef>(null);

  const service = useBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredBranchs = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(branch => branch.branchName.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchBranch();
    }, 1000);
  }, []);

  const isUserAdmin = useMemo(() => {
    return currentUser?.userType === 'userLogin';
  }, [currentUser]);

  const handleEdit = (item: BranchType) => {
    branchEditRef.current?.openDialog({
      ...omit(['actions', 'createDate', 'branchHeadPhone', 'updateDate', 'provinceName', 'branchHeadFullName'], item),
      branchHeadId: item.branchHeadId ? item.branchHeadId.toString() : null,
      provinceId: item.provinceId?.toString(),
    });
  };

  const handleDelete = async (id: number) => {
    open();

     try {

      const result = await service.deleteBranch(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchBranch();
      
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
  const renderBoolean = (value: boolean) => {
    return (
      <Badge color={value ? 'green' : 'red'}>
        {value ? 'Evet' : 'Hayır'}
      </Badge>
    );
  };

  const rowsTable = filteredBranchs.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'isRent') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field])}
            </Table.Td>
          );
        }
        if (header.field === 'branchHeadFullName') {
          return (
            <Table.Td key={header.field}>
              {`${item[header.field]}(${item.branchHeadPhone || '-'})`}
            </Table.Td>
          );
        }
        if (header.field === 'rentalPrice') {
          return (
            <Table.Td key={header.field}>
              {`${item[header.field] ?? "-"} ₺`}
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

  const fetchBranch = async () => {
     open();

     try {
      const headId = !isUserAdmin ? currentUser.id as number : undefined;
      const getBranches = await service.getBranches(headId);
      if (getBranches) {
        setResultData(getBranches.map((branch: BranchType) => ({
          ...branch,
          openingDate: branch.openingDate ? formatDate(branch.openingDate, dateFormatStrings.defaultDateFormat) : null,
          createDate: branch.createDate ? formatDate(branch.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();

    } catch (error: any) {
        toast.error(`getDuties yüklenirken hata: ${error.message}`);
      close();
    }
  };

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchBranch();
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
    return "Temsilcilikler Raporu";
  }

  // raportdata
  const raportVehicleData = useMemo(() => {
    return filteredBranchs.map((branch: BranchType) => ({
      ...branch,
      isRent: branch.isRent ? "Evet" : "Hayır",
      branchHeadFullName: `${branch.branchHeadFullName} (${branch.branchHeadPhone || '-'})`,
      rentalPrice: `${branch.rentalPrice ?? "-"} ₺`,
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
              <Title order={2}>Temsilcilik Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />}
            onClick={() => branchAddRef.current?.openDialog()} disabled={!isUserAdmin}>Yeni Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={() => branchAddRef.current?.openDialog()}
              hiddenFrom="xs"
              p="xs" disabled={!isUserAdmin}
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
                    label="Şube Ara"
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
              <Title order={4}>Son Temsilcilik({rowsTable?.length || 0})</Title>
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
        <BranchAdd ref={branchAddRef} onSaveSuccess={handleSaveSuccess} />
        <BranchEdit ref={branchEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
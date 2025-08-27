import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconFilter, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Switch, Stack, Group, Title, Text, Button, Paper, Table,
  ActionIcon, LoadingOverlay, Flex,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Country, Province, MenuActionButton, Role } from '../components'
import UserAdd, { type UserAddDialogControllerRef } from '../components/users/userAdd';
import UserEdit, { type UserEditDialogControllerRef } from '../components/users/userEdit';
import ConfirmModalMessage, { type ConfirmModalMessageRef } from '../components/confirmModalMessage';
import { useUserService } from '../services/userService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '~/authContext';
import { type PdfTableColumn } from '../utils/repor/exportToPdf';
import { calculateColumnWidthUser } from '../utils/repor/calculateColumnWidth';
import { type ColumnDefinition, type ValueData } from '../utils/repor/exportToExcel';

type filterModels = {
  countryId?: string | null;
  provinceIds?: string[] | null;
  roleId?: string | null;
  searchText?: string;
  isActive: boolean;
}

interface Column {
  field: string;
  header: string;
}

export default function User() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [isDisabledDeleteAction, setDisabledDeleteAction]= useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null | undefined>(null);
  const [filterModel, setFilterModel] = useState<filterModels>({ isActive: true, countryId: '1' });
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null); // Silinecek öğenin ID'sini tut
  const [selectedCountryName, setSelectedCountryName] = useState<string>('Türkiye'); // Yeni state
  const [selectedProvinceNames, setSelectedProvinceNames] = useState<string[]>([]); // Yeni state
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(''); // Yeni state
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'roleName', header: 'Role' },
    { field: 'phoneWithCountryCode', header: 'Telefon' },
    { field: 'email', header: 'Mail' },
    { field: 'identificationNumber', header: 'Kimlik' },
    { field: 'dateOfBirth', header: 'Doğum Yılı' },
    { field: 'countryName', header: 'Ülke' },
    { field: 'provinceName', header: 'İl' },
    { field: 'createdDate', header: 'İlk Kayıt' },
    { field: 'updateDate', header: 'Güncelleme' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  const userAddRef = useRef<UserAddDialogControllerRef>(null);
  const userEditRef = useRef<UserEditDialogControllerRef>(null);
  const confirmModalMessageRef = useRef<ConfirmModalMessageRef>(null);

  const { isLoggedIn } = useAuth();

  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    if (isLoggedIn) {
      setTimeout(() => {
        fetchUsers();
      }, 1500);
    }
  }, []);

  const handleEdit = (item: any) => {
     userEditRef.current?.openDialog({
      id: item.id,
      fullName: item.fullName,
      identificationNumber: item.identificationNumber,
      email: item.email,
      countryCode: item.countryCode,
      phone: item.phone,
      dateOfBirth: item.dateOfBirth ? item.dateOfBirth.toString() : '',
      isActive: item.isActive,
      password: item.password,
      moduleRoles: item.moduleRoles,
      roleId: item.roleId.toString(),
      countryId: item.countryId.toString(),
      provinceId: item.provinceId?.toString(),
      deleteMessageTitle: item.deleteMessageTitle?.toString(),
      createdDate: item.createdDate,
      updateDate: item.updateDate,
     });
  };

  const handleDelete = (id: number) => {
    setSelectedItemId(id);
    confirmModalMessageRef.current?.open()
  };

  const rowsTable = resultData.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
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
                  color="red"
                  disabled={isDisabledDeleteAction}
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

  const onCountrySelected = (countryValue: string | null, countryName?: string): void => {
    setSelectedCountryName(countryName || '');
    setSelectedCountry(countryValue);
    setSelectedProvinceNames([]);

    setFilterModel((prev) => ({
      ...prev,
      provinceIds: [],
      countryId: countryValue,
    }));
  }

  const onProvinceChange = (provinceValues: string[] | null, provinceNames?: string[]): void => {
    setSelectedProvinceNames(provinceNames || []);

    setFilterModel((prev) => ({
      ...prev,
      provinceIds: provinceValues,
    }));
  };

  const onRoleChange = (roleValue: string | null, roleName?: string | null): void => {
    setSelectedRoleName(roleName || '');

    setFilterModel((prev) => ({
      ...prev,
      roleId: roleValue,
    }));
  };

  const fetchUsers = async () => {
     open();

    const params = {
      ...filterModel,
      provinceIds: (filterModel.provinceIds && filterModel.provinceIds?.length > 0) ? filterModel.provinceIds?.join(",") : undefined,
      searchText: (filterModel.searchText && filterModel.searchText.length > 3 ? filterModel.searchText.trim() : undefined),
    }
     try {

      const getUsers = await service.users(params);
      if (getUsers) {
        setResultData(getUsers.map((item: any) => ({
          ...item,
          createdDate: formatDate(item.createdDate),
          updateDate: formatDate(item.updateDate),
          phoneWithCountryCode: (item.countryCode && item.phone) ? `${item.countryCode}${item.phone}` : undefined
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
        setDisabledDeleteAction(!filterModel.isActive);
    } catch (error: any) {

      toast.error(`Kullanıcılar yüklenirken hata: ${error.message}`);
      close();
    }
  };

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchUsers();
    }, 1500);
  };

  const confirmModalMessageHandleConfirm = async (messageText: string) => {
    if (selectedItemId) {
      const result = await service.deleteUser(selectedItemId, messageText);

      if (result) {
        toast.success('Kullanıcı başarıyla silindi!');
        fetchUsers(); // Verileri yeniden çek
      } else {
        toast.error('Kullanıcı silinirken hata oluştu!');
      }
    }
    
    confirmModalMessageRef.current?.close();
    setSelectedItemId(null); // ID'yi temizle
  };

  const confirmModalMessageHandleCancel = () => {
    confirmModalMessageRef.current?.close();
    setSelectedItemId(null); // ID'yi temizle
    toast.info('İşlem iptal edildi.');
  };

   // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'updateDate' && col.field != 'countryCode' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field,
      title: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
      width: calculateColumnWidthUser(col.field) // Özel genişlik hesaplama fonksiyonu
    }));
  }, [rowHeaders]);


 // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const excelTableColumns = useMemo((): ColumnDefinition[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'updateDate' && col.field != 'countryCode' && col.field != 'actions');

    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowHeaders]);

  const reportTitle = (): string => {
    const isActiveText = filterModel.isActive ? 'Aktif' : 'Pasif';

    if (selectedProvinceNames?.length > 0 && selectedRoleName) {
      const provinceNames = selectedProvinceNames.join(",")

      return `${selectedCountryName}/${provinceNames}/${selectedRoleName}/${isActiveText} Kullanıcı Raporu`;
    }

    if (!selectedRoleName && selectedProvinceNames?.length > 0) {
      const provinceNames = selectedProvinceNames.join(",")
      
      return `${selectedCountryName}/${provinceNames}/Tüm Roller/${isActiveText} Kullanıcı Raporu`;
    }
    if (selectedRoleName && !(selectedProvinceNames?.length < 1)) {
      return `${selectedCountryName}/Tüm İller/${selectedRoleName}/${isActiveText} Kullanıcı Raporu`;
    }

    return `${selectedCountryName}/Tüm İller/Tüm Roller/${isActiveText} Kullanıcı Raporu`;
  };

  return (
      <Container size="xl">
        <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }}/>
        <Stack gap="lg">
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Kullanıcı Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" onClick={() => userAddRef.current?.open()}>Yeni Ekle</Button>
          </Group>

          {/* İçerik Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={4}>
                  <Country onCountryChange={onCountrySelected}/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Province onProvinceChange={onProvinceChange} countryId={selectedCountry}/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <TextInput
                    label="Ad soyad, telefon ve kimlik ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    onChange={(event) => setFilterModel(prev => ({
                      ...prev,
                      searchText: event.currentTarget?.value}))}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <Role onRoleChange={onRoleChange}></Role>
                </Grid.Col>

                <Grid.Col span={2}>
                  <Flex
                    mih={50}
                    gap="md"
                    justify="flex-start"
                    align="flex-end"
                    direction="row"
                    wrap="wrap"
                  >
                    <Switch 
                      label="Kullanıcı Durumu" 
                      checked={filterModel.isActive}
                      onChange={(event) => {
                        setFilterModel(prev => ({
                        ...prev,
                        isActive: event.currentTarget?.checked
                      }))}}
                    />
                  </Flex>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Flex
                    mih={50}
                    gap="md"
                    justify="flex-start"
                    align="flex-end"
                    direction="row"
                    wrap="wrap"
                  >
                    <Button
                      leftSection={<IconFilter size={14} />}
                      onClick={fetchUsers}>
                      Filtrele
                    </Button>
                  </Flex>
                </Grid.Col>
                { false && 
                <Grid.Col span={4}>
                  <Flex mih={50} gap="md" direction="row" wrap="wrap">
                    <MenuActionButton
                    reportTitle={reportTitle()}
                    excelColumns={excelTableColumns}
                    valueData={resultData}
                    pdfColumns={pdfTableColumns}
                    type={2}
                    />
                  </Flex>
                </Grid.Col>}
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Kullanıcılar({rowsTable?.length || 0})</Title>
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
        <ConfirmModalMessage ref={confirmModalMessageRef}
          onConfirm={confirmModalMessageHandleConfirm} onCancel={confirmModalMessageHandleCancel} />
        <UserAdd ref={userAddRef} onSaveSuccess={handleSaveSuccess} />
        <UserEdit ref={userEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
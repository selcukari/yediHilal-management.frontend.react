import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconFilter, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Switch, Stack, Group, Title, Text, Button, Paper, Table,
  ActionIcon, LoadingOverlay, Flex,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Country, Province, MenuActionButton, Role } from '../../components'
import UserAdd, { type UserAddDialogControllerRef } from '../../components/users/userAdd';
import UserEdit, { type UserEditDialogControllerRef } from '../../components/users/userEdit';
import ConfirmModalMessage, { type ConfirmModalMessageRef } from '../../components/confirmModalMessage';
import { useUserService } from '../../services/userService';
import { useBranchService } from '../../services/branchService';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useAuth } from '~/authContext';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthUser } from '../../utils/repor/calculateColumnWidth';
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';

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

interface DutiesType {
  ids: string;
  names: string;
  createDate: string;
  authorizedPersonId: number; // yetkili kişi tarafından atandı id
  authorizedPersonName: string; // yetkili kişi tarafından atandı name
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
  branchSancaktars?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  rentalPrice?: number;
  isRent: boolean;
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
}

export default function User() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [sancaktarUserData, setSancaktarUserData] = useState<SancaktarDataGorevatama[]>([]);
  const [isDisabledDeleteAction, setDisabledDeleteAction]= useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null | undefined>(null);
  const [filterModel, setFilterModel] = useState<filterModels>({ isActive: true, countryId: '1' });
  const [selectedCountryName, setSelectedCountryName] = useState<string>('Türkiye'); // Yeni state
  const [selectedProvinceNames, setSelectedProvinceNames] = useState<string[]>([]); // Yeni state
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(''); // Yeni state
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'roleName', header: 'Role' },
    { field: 'duties', header: 'Görevi' },
    { field: 'phoneWithCountryCode', header: 'Telefon' },
    { field: 'email', header: 'Mail' },
    { field: 'identificationNumber', header: 'Kimlik' },
    { field: 'dateOfBirth', header: 'Doğum Yılı' },
    { field: 'countryName', header: 'Ülke' },
    { field: 'provinceName', header: 'İl' },
    { field: 'createdDate', header: 'İlk Kayıt' },
    { field: 'updateDate', header: 'Güncelleme' },
  ]);


  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceBranch = useBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const rowsTable = resultData.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'duties') {
          return (
            <Table.Td key={header.field}>
              {item["duties"] && item["duties"][item["duties"].length-1]?.names}
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
          createdDate: formatDate(item.createdDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          updateDate: formatDate(item.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          phoneWithCountryCode: (item.countryCode && item.phone) ? `${item.countryCode}${item.phone}` : undefined,
          duties: (item.duties && JSON.parse(item.duties)) as DutiesType[],
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

  const fetchBranch = async () => {
     open();
  
     try {
  
      const getBranches = await serviceBranch.getBranches();
      if (getBranches) {
        setResultData(getBranches.map((branch: BranchType) => ({
          ...branch,
          openingDate: branch.openingDate ? formatDate(branch.openingDate, dateFormatStrings.defaultDateFormat) : null,
          createDate: branch.createDate ? formatDate(branch.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
        })));

        setSancaktarUserData(
            getBranches
              .filter((i: BranchType) => i.branchSancaktars)
                .map((branch: BranchType) => ({
                  ...branch,
                  branchSancaktars: (() => {
                    try {
                    return JSON.parse(branch.branchSancaktars ?? "");
                    } catch {
                    return null;
                    }
                  })()
                }))
        );

        console.log("setSancaktarUserData:", sancaktarUserData);
       
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

  useEffect(() => {
      setTimeout(() => {
        // fetchUsers();
        fetchBranch();
      }, 500);
  }, []);


   // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {

    const newCols: Column[] = rowHeaders.filter(col =>
      col.field != 'updateDate' && col.field != 'countryCode' && col.field != 'actions' && col.field != 'countryName');

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
      col.field != 'updateDate' && col.field != 'countryCode' && col.field != 'actions' && col.field != 'countryName');

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

   // raportdata
  const raportUserData = useMemo(() => {
    return resultData.map((user: any) => ({
      ...user,
      duties: user["duties"] && user["duties"][user["duties"].length-1]?.names,
    }))
  }, [resultData])

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
          </Group>

          {/* İçerik Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Country onCountryChange={onCountrySelected}/>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Province onProvinceChange={onProvinceChange} countryId={selectedCountry}/>
                </Grid.Col>

              
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
                  <Role onRoleChange={onRoleChange}></Role>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3}}>
                  <TextInput
                    label="Ad soyad, telefon ve kimlik ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    onChange={(event) => setFilterModel(prev => ({
                      ...prev,
                      searchText: event.currentTarget?.value}))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2}}>
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
                <Grid.Col span={{ base: 5, sm: 4, md: 1}}>
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
                <Grid.Col span={{ base: 5, sm: 4, md: 2}}>
                  <Flex mih={50} gap="md" justify="flex-start"
                    align="flex-end" direction="row" wrap="wrap">
                    <MenuActionButton
                    reportTitle={reportTitle()}
                    excelColumns={excelTableColumns}
                    valueData={raportUserData}
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
      </Container>
  );
}
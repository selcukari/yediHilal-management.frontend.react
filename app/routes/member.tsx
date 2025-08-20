import { useState, useRef, useEffect, useCallback } from 'react';
import { IconSearch, IconFilter, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Switch, Stack, Group, Title, Text, Button, Paper, Table, Badge,
  ActionIcon, LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Country, Province } from '../components'
import MemberAdd, { type DialogControllerRef } from '../components/memberAdd';
import { useMemberService } from '../services/memberService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '~/authContext';

type filterModels = {
  countryId?: string | null;
  provinceId?: string | null;
  searchText?: string;
  isActive: boolean;
}

export default function Member() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null | undefined>(null);
  const [filterModel, setFilterModel] = useState<filterModels>({ isActive: true, countryId: '1' });
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'phone', header: 'Telefon' },
    { field: 'email', header: 'Mail' },
    { field: 'isSms', header: 'Sms' },
    { field: 'isMail', header: 'Mail' },
    { field: 'identificationNumber', header: 'Kimlik' },
    { field: 'referenceFullName', header: 'Referans İsmi' },
    { field: 'referencePhone', header: 'Referans Telefon' },
    { field: 'dateOfBirth', header: 'Doğum Yılı' },
    { field: 'countryName', header: 'Ülke' },
    { field: 'provinceName', header: 'İl' },
    { field: 'createdDate', header: 'İlk Kayıt' },
    { field: 'updateDate', header: 'Güncelleme' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  const memberAddRef = useRef<DialogControllerRef>(null);
  const { isLoggedIn } = useAuth();

  const service = useMemberService('management');

  useEffect(() => {
    if (isLoggedIn) {
      setTimeout(() => {
        fetchMembers();
      }, 1500);
    }
  }, []);

  const renderBoolean = (value: boolean) => {
    return (
      <Badge color={value ? 'green' : 'red'}>
        {value ? 'Evet' : 'Hayır'}
      </Badge>
    );
  };

  const handleEdit = (id: number) => {
    console.log('Edit:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Delete:', id);
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
                  onClick={() => handleEdit(item.id)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" 
                  color="red"
                  onClick={() => handleDelete(item.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          );
        }

        if (header.field === 'isSms' || header.field === 'isMail') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field])}
            </Table.Td>
          );
        }

        if (header.field === 'referencePhone') {
          return (
            <Table.Td key={header.field}>
              {item["referenceFullName"] ? `${item["referenceCountryCode"]}${item[header.field]}`: "-"}
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

  const onCountrySelected = (countryValue: string | null): void => {
    setSelectedCountry(countryValue);

    setFilterModel((prev) => ({
      ...prev,
      countryId: countryValue,
    }));
  }

  const onProvinceChange = (provinceValue: string | null): void => {
    setFilterModel((prev) => ({
      ...prev,
      provinceId: provinceValue,
    }));
  };

  const fetchMembers = async () => {
     open();

    const params: filterModels = {
      ...filterModel,
      ...(filterModel.searchText && filterModel.searchText.length > 3 ? { searchText: filterModel.searchText } : {})
    }
     try {

      const getMembers = await service.members(params);
      if (getMembers) {
        setResultData(getMembers.map((item: any) => ({
          ...item,
          createdDate: formatDate(item.createdDate),
          updateDate: formatDate(item.updateDate),
          phone: (item.countryCode && item.phone) ? `${item.countryCode}${item.phone}` : undefined
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
      console.error('Error fetching getMembers:', error.message);
        toast.error(`Üye yüklenirken hata: ${error.message}`);
      close();
    }
  };

  const handleSaveSuccess = () => {
    console.log('Yeni üye eklendi, veriler yenileniyor...');
    fetchMembers(); // Verileri yeniden çek
  };

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
              <Title order={2}>Üye Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" onClick={() => memberAddRef.current?.open()}>Yeni Ekle</Button>
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
                <Grid.Col span={4}>
                  <Country onCountryChange={onCountrySelected}/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Province onProvinceChange={onProvinceChange} countryId={selectedCountry}/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <TextInput
                    label="Ad soyad veya telefon"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    onChange={(event) => setFilterModel(prev => ({
                      ...prev,
                      searchText: event.currentTarget?.value}))}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <Switch 
                    label="Üye Durumu" 
                    checked={filterModel.isActive}
                    onChange={(event) => {
                      console.log("Switch changed:", event.currentTarget.checked);
                      setFilterModel(prev => ({
                      ...prev,
                      isActive: event.currentTarget?.checked
                    }))}}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button
                    leftSection={<IconFilter size={14} />}
                    onClick={fetchMembers}>
                    Filtrele
                  </Button>
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son İşlemler</Title>
              <Table.ScrollContainer minWidth={500} maxHeight={300}>
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

        <MemberAdd ref={memberAddRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
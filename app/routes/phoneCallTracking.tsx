import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Badge, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { omit } from 'ramda';
import { useDisclosure } from '@mantine/hooks';
import PhoneCallTrackingAdd, { type PhoneCallTrackingAddDialogControllerRef } from '../components/phoneCallTracking/phoneCallTrackingAdd';
import PhoneCallTrackingEdit, { type PhoneCallTrackingEditDialogControllerRef } from '../components/phoneCallTracking/phoneCallTrackingEdit';
import { usePhoneCallTrackingService } from '../services/phoneCallTrackingService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';

interface Column {
  field: keyof PhoneCallTrackingType;
  header: string;
}

interface PhoneCallTrackingType {
  id: number;
  name: string;
  responsibleId: string;
  responsibleFullName: string;
  fileUrls: string;
  createDate?: string | null;
  updateDate?: string | null;
  note: string | null;
  isActive: boolean;
  isCompleted: boolean;
  actions?: any
}

export default function DocumentTracking() {
  const [resultData, setResultData] = useState<PhoneCallTrackingType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Evrak Adı' },
    { field: 'responsibleFullName', header: 'Sorumlu' },
    { field: 'fileUrls', header: 'Evraklar' },
    { field: 'isCompleted', header: 'Tamamlandı mı?' },
    { field: 'note', header: 'Note' },
    { field: 'createDate', header: 'İlk Kayıt T.' },
    { field: 'updateDate', header: 'Güncelleme T.' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  const phoneCallTrackingAddRef = useRef<PhoneCallTrackingAddDialogControllerRef>(null);
  const phoneCallTrackingEditRef = useRef<PhoneCallTrackingEditDialogControllerRef>(null);

  const service = usePhoneCallTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredPhoneCalls = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(branch => branch.name.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchPhoneCallTracking();
    }, 1000);
  }, []);

  const handleEdit = (item: PhoneCallTrackingType) => {
     phoneCallTrackingEditRef.current?.openDialog({
      ...omit(['actions', 'isActive', 'createDate', 'updateDate', 'responsibleFullName'], item),
      responsibleId: item.responsibleId.toString()
     });
  };
  const getFileNameWithoutUUID = (url: string) => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const fileNameWithExtension = pathParts[pathParts.length - 1];
        const fileName = fileNameWithExtension.replace(/\.[^/.]+$/, "");
        
        // UUID'den önceki kısmı al (son _'ya kadar)
        const lastUnderscoreIndex = fileName.lastIndexOf('_');
        if (lastUnderscoreIndex !== -1) {
          return fileName.substring(0, lastUnderscoreIndex);
        }

        return fileName;
    } catch (error) {
        console.error('Geçersiz URL:', url);
        return null;
    }
  }

  const handleDelete = async (id: number) => {
    open();

     try {

      const result = await service.deletePhoneCallTracking(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchPhoneCallTracking();
      
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

  const rowsTable = filteredPhoneCalls.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
    
        if (header.field === 'fileUrls') {
          return (
            <Table.Td key={header.field}>
              {`${(item[header.field] || "")?.split(",").map((fileUrl: string) => getFileNameWithoutUUID(fileUrl)).join(",").substring(0,25)}`}
            </Table.Td>
          );
        }
        if (header.field === 'note') {
          return (
            <Table.Td key={header.field}>
              {((item[header.field] || "")?.substring(0,25))}
            </Table.Td>
          );
        }
        if (header.field === 'isCompleted') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field])}
            </Table.Td>
          );
        }
        if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <ActionIcon 
                  variant="light" color="blue"
                  onClick={() => handleEdit(item)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" color="red"
                  disabled={item["isCompleted"]}
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

  const fetchPhoneCallTracking = async () => {
     open();

     try {

      const getphoneCallTrackings = await service.getPhoneCallTrackings();
      if (getphoneCallTrackings) {
        setResultData(getphoneCallTrackings.map((phoneCallTracking: PhoneCallTrackingType) => ({
          ...phoneCallTracking,
          updateDate: phoneCallTracking.updateDate ? formatDate(phoneCallTracking.updateDate, dateFormatStrings.defaultDateFormat) : null,
          createDate: phoneCallTracking.createDate ? formatDate(phoneCallTracking.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();

    } catch (error: any) {
        toast.error(`PhoneCallTracking yüklenirken hata: ${error.message}`);
        close();
    }
  };

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchPhoneCallTracking();
    }, 1000);
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
              <Title order={2}>Telefon Arama Takip Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />} onClick={() => phoneCallTrackingAddRef.current?.open()}>Yeni Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={() => phoneCallTrackingAddRef.current?.open()}
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
                    label="Telefon Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Arama Takip Evraklar({rowsTable?.length || 0})</Title>
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
        <PhoneCallTrackingAdd ref={phoneCallTrackingAddRef} onSaveSuccess={handleSaveSuccess} />
        <PhoneCallTrackingEdit ref={phoneCallTrackingEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
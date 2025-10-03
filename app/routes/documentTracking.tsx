import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Badge, Flex, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { omit } from 'ramda';
import { useDisclosure } from '@mantine/hooks';
import DocumentTrackingAdd, { type DocumentTrackingAddDialogControllerRef } from '../components/documentTracking/documentTrackingAdd';
import DocumentTrackingEdit, { type DocumentTrackingEditDialogControllerRef } from '../components/documentTracking/documentTrackingEdit';
import { useDocumentTrackingService } from '../services/documentTrackingService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';

interface Column {
  field: keyof DocumentTrackingType;
  header: string;
}

interface DocumentTrackingType {
  id: number;
  name: string;
  responsibleId: string;
  responsibleFullName: string;
  fileUrls: string;
  createDate?: string | null;
  updateDate?: string | null;
  note: string | null;
  isActive: boolean;
  actions?: any
}

export default function DocumentTracking() {
  const [resultData, setResultData] = useState<DocumentTrackingType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Evrak Adı' },
    { field: 'responsibleFullName', header: 'Sorumlu' },
    { field: 'fileUrls', header: 'Evraklar' },
    { field: 'note', header: 'Note' },
    { field: 'createDate', header: 'İlk Kayıt T.' },
    { field: 'updateDate', header: 'Güncelleme T.' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  const documentTrackingAddRef = useRef<DocumentTrackingAddDialogControllerRef>(null);
  const documentTrackingEditRef = useRef<DocumentTrackingEditDialogControllerRef>(null);

  const service = useDocumentTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredBranchs = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(branch => branch.name.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchDocumentTracking();
    }, 1000);
  }, []);

  const handleEdit = (item: DocumentTrackingType) => {
     documentTrackingEditRef.current?.openDialog({
      ...omit(['actions', 'isActive', 'createDate', 'updateDate', 'responsibleId', 'responsibleFullName'], item),
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

      const result = await service.deleteDocumentTracking(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchDocumentTracking();
      
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
              {(item[header.field] && (item[header.field] || "")?.substring(0,25))}
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
                  color="red"
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

  const fetchDocumentTracking = async () => {
     open();

     try {

      const getDocumentTrackings = await service.getDocumentTrackings();
      if (getDocumentTrackings) {
        setResultData(getDocumentTrackings.map((documentTracking: DocumentTrackingType) => ({
          ...documentTracking,
          updateDate: documentTracking.updateDate ? formatDate(documentTracking.updateDate, dateFormatStrings.defaultDateFormat) : null,
          createDate: documentTracking.createDate ? formatDate(documentTracking.createDate, dateFormatStrings.dateTimeFormatWithoutSecond) : null,
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();

    } catch (error: any) {
        toast.error(`DocumentTracking yüklenirken hata: ${error.message}`);
        close();
    }
  };

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchDocumentTracking();
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
              <Title order={2}>Evraklar Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" leftSection={<IconPlus size={14} />} onClick={() => documentTrackingAddRef.current?.open()}>Yeni Ekle</Button>
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
                  <TextInput
                    label="Evrak Ara"
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
              <Title order={4}>Son Evraklar({rowsTable?.length || 0})</Title>
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
        <DocumentTrackingAdd ref={documentTrackingAddRef} onSaveSuccess={handleSaveSuccess} />
        <DocumentTrackingEdit ref={documentTrackingEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
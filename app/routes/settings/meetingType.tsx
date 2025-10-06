import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import MeetingTypeAdd, { type MeetingTypeAddDialogControllerRef } from '../../components/meetingType/meetingTypAdd';
import MeetingTypeEdit, { type MeetingTypeEditDialogControllerRef } from '../../components/meetingType/meetingTypEdit';
import { useMeetingTypeService } from '../../services/meetingTypeService';
import { toast } from '../../utils/toastMessages';

interface Column {
  field: keyof MeetingType;
  header: string;
}

interface MeetingType {
  id: number;
  name: string;
  isActive: boolean;
  actions?: any
}

export default function MeetingType() {
  const [resultData, setResultData] = useState<MeetingType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Mesaj' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  const meetingTypeAdd = useRef<MeetingTypeAddDialogControllerRef>(null);
  const meetingTypeEdit = useRef<MeetingTypeEditDialogControllerRef>(null);

  const service = useMeetingTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(duty => duty.name.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  const fetchMeetingType = async () => {
    open();

    try {

     const getDuties = await service.getMeetingTypes();
     if (getDuties) {
       setResultData(getDuties.map((duty: MeetingType) => ({
         id: duty.id,
         name: duty.name,
         isActive: duty.isActive
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

  useEffect(() => {
    setTimeout(() => {
      fetchMeetingType();
    }, 1000);
  }, []);

  const handleEdit = (item: MeetingType) => {
    meetingTypeEdit.current?.openDialog(item);
  };

  const handleDelete = async (id: number) => {
    open();

     try {

      const result = await service.deleteMeetingType(id);
      if (result == true) {

      toast.success('İşlem başarılı!');
      
      fetchMeetingType();
      
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

  const rowsTable = filteredUsers.map((item) => (
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

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchMeetingType();
    }, 1500);
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
              <Title order={2}>Toplantı Türleri</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14} />} onClick={() => meetingTypeAdd.current?.open()}>Yeni Ekle</Button>
            {/* Mobile için sadece icon buton */}
            <Button 
              variant="filled" 
              onClick={() => meetingTypeAdd.current?.open()}
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
                    label="Toplantı Türü Ara"
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
              <Title order={4}>Toplantı Türleri({rowsTable?.length || 0})</Title>
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
        <MeetingTypeEdit ref={meetingTypeEdit} onSaveSuccess={handleSaveSuccess} />
        <MeetingTypeAdd ref={meetingTypeAdd} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
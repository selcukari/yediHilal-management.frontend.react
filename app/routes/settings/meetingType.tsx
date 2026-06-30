import { useState, useRef, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Tooltip, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // ✨ React Query kancaları eklendi
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
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  // ✨ Cache yönetimi için QueryClient çağrılıyor
  const queryClient = useQueryClient();

  const [rowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Mesaj' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  
  const meetingTypeAdd = useRef<MeetingTypeAddDialogControllerRef>(null);
  const meetingTypeEdit = useRef<MeetingTypeEditDialogControllerRef>(null);

  const service = useMeetingTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // 1. VERİ ÇEKME (useQuery)
  // Eski useEffect, useState ve fetchMeetingType yapısının tamamını tek başına karşılar.
  const { data: resultData = [], isLoading: isQueryLoading } = useQuery({
    queryKey: ['meetingTypes'],
    queryFn: async () => {
      const getDuties = await service.getMeetingTypes();
      if (getDuties) {
        return getDuties.map((duty: MeetingType) => ({
          id: duty.id,
          name: duty.name,
          isActive: duty.isActive
        }));
      }
      toast.info('Hiçbir veri yok!');
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24, // Veriyi 1 gün güncel kabul et, gereksiz API isteklerini önle
  });

  // 2. VERİ SİLME (useMutation)
  // fetchMeetingType() çağırmak yerine query cache'ini patlatarak listeyi otomatik yeniler.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await service.deleteMeetingType(id);
    },
    onMutate: () => {
      open(); // İşlem başladığında LoadingOverlay göster
    },
    onSuccess: (result) => {
      if (result === true) {
        toast.success('İşlem başarılı!');
        // ✨ Liste önbelleğini (cache) geçersiz kılıp otomatik güncel veriyi çektiriyoruz
        queryClient.invalidateQueries({ queryKey: ['meetingTypes'] });
      } else if (result?.data === false && result?.errors?.length > 0) {
        toast.warning(result.errors[0]);
      } else {
        toast.error('Bir hata oluştu!');
      }
    },
    onError: (error: any) => {
      toast.error(`Silme işleminde bir hata: ${error.message}`);
    },
    onSettled: () => {
      close(); // İşlem bittiğinde LoadingOverlay gizle
    }
  });

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    return resultData.filter((duty: MeetingType) => 
      duty.name.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [resultData, searchText]);

  const handleEdit = (item: MeetingType) => {
    meetingTypeEdit.current?.openDialog(item);
  };

  const handleDelete = (id: number) => {
    // Yazdığımız mutation'ı id ile tetikliyoruz
    deleteMutation.mutate(id);
  };

  // 3. YENİ EKLEME VEYA GÜNCELLEME BAŞARILI OLDUĞUNDA
  const handleSaveSuccess = () => {
    // Manuel setTimeout() beklemelerine son! Cache'i sildiğimiz an liste anında yenilenir.
    queryClient.invalidateQueries({ queryKey: ['meetingTypes'] });
  };

  const rowsTable = filteredUsers.map((item: MeetingType) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <Tooltip label="Güncelle">
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(item)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Sil">
                  <ActionIcon variant="light" color="red" onClick={() => handleDelete(item.id)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
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

  return (
      <Container size="xl">
        <LoadingOverlay
          visible={visible || isQueryLoading} // İlk yüklemede ve silme işlemlerinde loading tetiklenir
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
            <Button variant="filled" onClick={() => meetingTypeAdd.current?.open()} hiddenFrom="xs" p="xs">
              <IconPlus size={18} />
            </Button>
          </Group>

          {/* İçerik Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
import { useState, useRef, useMemo } from 'react';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, ActionIcon, Stack, Group, Title, Text, Paper, Table, LoadingOverlay, Button,
  Tooltip,
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // ✨ useMutation ve useQueryClient eklendi
import { useDisclosure } from '@mantine/hooks';
import UserDutyAdd, { type UserDutyAddDialogControllerRef } from '../../components/userDuty/userDutyAdd';
import UserDutyEdit, { type UserDutyEditDialogControllerRef } from '../../components/userDuty/userDutyEdit';
import { useUserDutyService } from '../../services/userDutyService';
import { toast } from '../../utils/toastMessages';

interface Column {
  field: keyof UserDutyType;
  header: string;
}

interface UserDutyType {
  id: number;
  name: string;
  isActive: boolean;
  actions?: any
}

export default function UserDuty() {
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  // ✨ React Query istemcisini çağırıyoruz
  const queryClient = useQueryClient();

  const [rowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Mesaj' },
    { field: 'actions', header: 'İşlemler' },
  ]);
  
  const userDutyAddRef = useRef<UserDutyAddDialogControllerRef>(null);
  const userDutyEditRef = useRef<UserDutyEditDialogControllerRef>(null);

  const service = useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // 1. VERİ ÇEKME (Query)
  const { data: resultData = [], isLoading: isQueryLoading } = useQuery({
    queryKey: ["duties"],
    queryFn: async () => {
      const response = await service.getUserDuties();
      return (response ?? []).map((duty: UserDutyType) => ({
        id: duty.id,
        name: duty.name,
        isActive: duty.isActive
      }));
    },
    staleTime: 1000 * 60 * 60 *24, // güncellik için 1 gun daha idealdir
  });

  // 2. VERİ SİLME (Mutation) - fetchDuty() yerine geçen sihirli kısım
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await service.deleteUserDuty(id);
    },
    onMutate: () => {
      open(); // Loading overlay aç
    },
    onSuccess: (result) => {
      if (result === true) {
        toast.success('İşlem başarılı!');
        // ✨ "duties" key'ine sahip query'yi geçersiz kıl ve otomatik fetch etmesini sağla!
        queryClient.invalidateQueries({ queryKey: ["duties", "userDuties"] });
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
      close(); // Loading overlay kapat
    }
  });

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    return resultData.filter((duty: UserDutyType) => 
      duty.name.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [resultData, searchText]);

  const handleEdit = (item: UserDutyType) => {
    userDutyEditRef.current?.openDialog(item);
  };

  const handleDelete = (id: number) => {
    // Yazdığımız mutation'ı tetikliyoruz
    deleteMutation.mutate(id);
  };

  // 3. YENİ EKLEME VEYA GÜNCELLEME BAŞARILI OLDUĞUNDA
  const handleSaveSuccess = () => {
    // Manuel setTimeout ve fetchDuty() yerine doğrudan query'yi yeniliyoruz
    queryClient.invalidateQueries({ queryKey: ["duties"] });
  };

  const rowsTable = filteredUsers.map((item: UserDutyType) => (
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
          visible={visible || isQueryLoading} // Sayfa ilk açılırken veya silme yapılırken loader gösterir
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'pink', type: 'bars' }}
        />
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Görev Türleri</Title>
              <Text size="sm" c="dimmed">Toolbar Filtreleme Alanı</Text>
            </div>
            <Button variant="filled" visibleFrom="xs" leftSection={<IconPlus size={14}/>} onClick={() => userDutyAddRef.current?.open()}>Yeni Ekle</Button>
            <Button variant="filled" onClick={() => userDutyAddRef.current?.open()} hiddenFrom="xs" p="xs">
              <IconPlus size={18} />
            </Button>
          </Group>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 4}}>
                  <TextInput
                    label="Görev Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Görevler({rowsTable?.length || 0})</Title>
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
        <UserDutyAdd ref={userDutyAddRef} onSaveSuccess={handleSaveSuccess} />
        <UserDutyEdit ref={userDutyEditRef} onSaveSuccess={handleSaveSuccess} />
      </Container>
  );
}
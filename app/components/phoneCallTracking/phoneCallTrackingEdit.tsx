import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit } from 'ramda';
import { Modal, TextInput, Button, ActionIcon, Group, Stack, Textarea, Title, Table, Paper, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck, IconEdit } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import PhoneCallStatu, { type PhoneCallStatuDialogControllerRef } from './phoneCallStatu';
import { usePhoneCallTrackingService } from '../../services/phoneCallTrackingService';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';

export type PhoneCallTrackingEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface PhoneCallTrackingEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  name: string;
  note?: string | null;
  responsibleId?: string | null;
  members: string;
};

type GetUserData = {
  id: string;
  fullName: string;
}

const PhoneCallTrackingEdit = forwardRef<PhoneCallTrackingEditDialogControllerRef, PhoneCallTrackingEditProps>(({onSaveSuccess}, ref) => {
  const [userData, setUserData] = useState<GetUserData[]>([]);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const service = usePhoneCallTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const phoneCallStatuRef = useRef<PhoneCallStatuDialogControllerRef>(null);

  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'typeNames', header: 'Üye Tipi' },
    { field: 'phoneWithCountryCode', header: 'Telefon' },
    { field: 'email', header: 'Mail' },
    { field: 'identificationNumber', header: 'Kimlik' },
    { field: 'referenceFullName', header: 'Referans İsmi' },
    { field: 'referencePhone', header: 'Referans Telefon' },
    { field: 'dateOfBirth', header: 'Doğum Yılı' },
    { field: 'countryName', header: 'Ülke' },
    { field: 'provinceName', header: 'İl' },
    { field: 'phoneCallStatudescription', header: 'Arama Notu' },
    { field: 'createdDate', header: 'İlk Kayıt' },
    { field: 'actions', header: 'Arama Durumu Gir' },
  ]);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      name: '',
      note: "",
      responsibleId: '',
      members: ""
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Şube Adı en az 5 karakter olmalı' : null),
      responsibleId: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
    },
  });

  const fetchUsers = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
      }
      const getUsers: any[] | null = await serviceUser.users(params);
      
      if (getUsers) {
        setUserData(getUsers.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
      } else {
        toast.info('Hiçbir veri yok!');
        setUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  },[]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Dosya form değerlerinden al
    const responsibleFullName = userData.find(user => user.id == values.responsibleId)?.fullName;
    
    const result = await service.updatePhoneCallTracking({
      ...values,
      responsibleId: parseInt(values.responsibleId ?? "1") as number,
      responsibleFullName: responsibleFullName as string,
      members: JSON.stringify(membersData),
    });

    if (result === true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      close();
      form.reset();
      setIsDisabledSubmit(false);

      return;
    }
    else if (result?.data === false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
  };

  const confirmDialogHandleCancel = () => {
    toast.info('İşlem iptal edildi')
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }

  const openDialog = (value: any) => {
    if (value) {
      form.setValues(value);

      // Members verisini parse et ve state'e kaydet
      try {
        if (Array.isArray(value.members)) {
          setMembersData(value.members);
        } else {
          setMembersData([]);
        }
      } catch (error) {
        console.error('Members verisi parse edilemedi:', error);
        setMembersData([]);
      }

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et
      form.reset();

      open();
    }
  }
  const handleEditPhoneCallStatu = (value: any) => {
    phoneCallStatuRef.current?.openDialog({id: value.id, phoneCallStatudescription: value.phoneCallStatudescription})
  }

  const phoneCallStatuSave = (value: any) => {

    setMembersData(prevData => 
    prevData.map(member => 
      member.id == value.id 
        ? { ...member, phoneCallStatudescription: value.phoneCallStatudescription }
        : member
    )
  );
    
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

  // Tablo satırlarını oluştur
  const tableRows = membersData.map((member) => (
    <Table.Tr key={member.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'actions') {
            return (
              <Table.Td key={header.field}>
                <Group gap="xs">
                  <ActionIcon 
                    variant="light" 
                    color="blue"
                    onClick={() => handleEditPhoneCallStatu({id: member.id as number, phoneCallStatudescription: member.phoneCallStatudescription})}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            );
          }

        return (<Table.Td key={header.field}>
          {member[header.field]?.toString() || '-'}
        </Table.Td>)
      })}
    </Table.Tr>
  ));

  // Tablo başlıklarını oluştur
  const tableHeaders = rowHeaders.map((header) => (
    <Table.Th key={header.field}>{header.header}</Table.Th>
  ));

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Arama Takip Güncelle"
      centered
      size="xl" // Tablo için daha geniş boyut
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Flex
              mih={50}
              gap="md"
              justify="center"
              align="center"
              direction="row"
              wrap="wrap">
            <Grid.Col span={4}>
              <TextInput
                label="Arama Takip Adı" placeholder="arama takip adı giriniz" required
                value={form.values.name}
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Sorumlu" placeholder="sorumlu Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))} disabled={isDisabledSubmit}
                searchable clearable maxDropdownHeight={200} nothingFoundMessage="sorumlu kişi bulunamadı..."
                required value={form.values.responsibleId} onChange={(value) => form.setFieldValue('responsibleId', value)}
              />
            </Grid.Col>
            <Grid.Col span={4}>
            <Textarea
              mt="md" label="Note" placeholder="note..."
              withAsterisk minRows={3}
              value={form.values.note}
              {...form.getInputProps('note')}
            />
            </Grid.Col>
          </Flex>
            
            {/* Members Tablosu */}
            {membersData.length > 0 && (
              <Grid.Col span={12}>
                <Title order={4} mb="sm">Üyeler</Title>
                <Paper withBorder p="md" style={{ overflow: 'auto', maxHeight: '400px' }}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        {tableHeaders}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {tableRows}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Grid.Col>
            )}
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
              Kaydet
            </Button>
          </Grid.Col>
          </Grid>
        </Stack>
      </form>
    </Modal>
      {/* confirm Dialog */}
    <ConfirmModal 
      ref={confirmModalRef}
      onConfirm={confirmDialogHandleConfirm}
      onCancel={confirmDialogHandleCancel}
    />
    <PhoneCallStatu 
      ref={phoneCallStatuRef}
      onSaveSuccess={phoneCallStatuSave}
    />
  </>);
});

export default PhoneCallTrackingEdit;
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Textarea, Title, Table, Paper, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { usePhoneCallTrackingService } from '../../services/phoneCallTrackingService';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';

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
  isCompleted: boolean,
  files?: any[];
};
type GetUserData = {
  id: string;
  fullName: string;
}

const PhoneCallTrackingEdit = forwardRef<PhoneCallTrackingEditDialogControllerRef, PhoneCallTrackingEditProps>(({onSaveSuccess}, ref) => {
  const [userData, setUserData] = useState<GetUserData[]>([]);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const service = usePhoneCallTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      name: '',
      note: "",
      responsibleId: '',
      isCompleted: false,
      files: [],
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
    const files = form.values.files || [];
    const responsibleFullName = userData.find(user => user.id == values.responsibleId)?.fullName;
    
    const result = await service.updatePhoneCallTracking({
      ...values,
      files: files.length > 0 ? files : undefined,
      responsibleId: values.responsibleId as string,
      responsibleFullName: responsibleFullName as string,
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
  const openDialog = (value: FormValues) => {
    if (value) {
      setIsDisabledSubmit(value.isCompleted)
      form.setValues(value);

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et
      form.reset();

      open();
    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));


  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Arama Takip Güncelle"
      centered
      size="400"
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
            <Grid.Col span={10}>
              <TextInput
                label="Arama Takip Adı" placeholder="arama takip adı giriniz" required
                value={form.values.name}
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={10}>
              <Select
                label="Sorumlu" placeholder="sorumlu Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))} disabled={isDisabledSubmit}
                searchable clearable maxDropdownHeight={200} nothingFoundMessage="sorumlu kişi bulunamadı..."
                required value={form.values.responsibleId} onChange={(value) => form.setFieldValue('responsibleId', value)}
              />
            </Grid.Col>
            <Grid.Col span={10}>
            <Textarea
              mt="md" label="Note" placeholder="note..."
              withAsterisk minRows={5}
              value={form.values.note}
              {...form.getInputProps('note')}
            />
            </Grid.Col>
            <Grid.Col span={10}>
              <Switch
                label="Tamamlandı mı?" 
                checked={form.values.isCompleted}
                onChange={(event) => form.setFieldValue('isCompleted', event.currentTarget.checked)}
              />
            </Grid.Col>
            <Grid.Col span={10}>
              <FileUpload
                form={form}
                required={true}
              />
            </Grid.Col>
          </Flex>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} disabled={form.values.isCompleted} leftSection={<IconCancel size={14} />}color="red">
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
  </>);
});

export default PhoneCallTrackingEdit;
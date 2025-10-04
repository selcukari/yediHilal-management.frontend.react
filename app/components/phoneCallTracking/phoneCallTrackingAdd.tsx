import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Textarea, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { usePhoneCallTrackingService } from '../../services/phoneCallTrackingService';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';

export type PhoneCallTrackingAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface PhoneCallTrackingAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
  note?: string | null;
  responsibleId?: string | null;
  files?: any[];
};
type GetUserData = {
  id: string;
  fullName: string;
}

const PhoneCallTrackingAdd = forwardRef<PhoneCallTrackingAddDialogControllerRef, PhoneCallTrackingAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [userData, setUserData] = useState<GetUserData[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  
  const service = usePhoneCallTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      note: "",
      responsibleId: '',
      files: [],
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Arama Takip Adı en az 5 karakter olmalı' : null),
      files: (value) => {
        return value && value?.length > 0 ? null : 'En az bir tane dosya eklenmeli';
      },
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

    const result = await service.addPhoneCallTracking({
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
    toast.info('İşlem iptal edildi');
  };
  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Arama Takip Ekle"
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
                label="Arama Takip Adı"
                placeholder="arama takip adı giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={10}>
              <Select
                label="Sorumlu" placeholder="sorumlu Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))}
                searchable clearable maxDropdownHeight={200} nothingFoundMessage="sorumlu kişi bulunamadı..."
                required onChange={(value) => form.setFieldValue('responsibleId', value)}
              />
            </Grid.Col>
          <Grid.Col span={10}>
            <Textarea
              mt="md" label="Note" placeholder="note..."
              withAsterisk minRows={5}
              {...form.getInputProps('note')}
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
  </>);
});

export default PhoneCallTrackingAdd;
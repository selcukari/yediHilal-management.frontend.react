import { forwardRef, useEffect, useImperativeHandle, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit } from 'ramda';
import { Modal, TextInput, Flex, Button, Stack, Grid, PasswordInput, Group, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { useUserService } from '../../services/userService';
import { RoleSelect } from '../addOrEdit/roleSelect';
import { toast } from '../../utils/toastMessages';
import { ModuleSelect } from '../addOrEdit/moduleSelect';
import { ResponsibleSelect } from '../addOrEdit/responsibleSelect';
import { useAuth } from '~/authContext';

export type UserEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface UserEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  isActive: boolean;
  countryId: string;
  roleId: string;
  moduleRoles: string;
  provinceId: string;
  createdDate?: string;
  password: string;
  updateDate?: string;
  responsibilities?: string;
  deleteMessageTitle?: string;
};

const UserEdit = forwardRef<UserEditDialogControllerRef, UserEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      fullName: '',
      identificationNumber: '',
      email: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: '',
      countryId: '1',
      roleId: '3',
      provinceId: '',
      isActive: true,
      createdDate: "",
      updateDate: "",
      password: '',
      moduleRoles: '',
      responsibilities: '',
      deleteMessageTitle: '',
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      password: (value) => (value.trim().length < 5 ? 'Şifre en az 5 karakter olmalı' : null),
      identificationNumber: (value) => {
        if (!value?.trim()) return null;
        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
      },
      countryCode: (value) => {

        return /^[0-9]+$/.test(value) ? null : 'Geçersiz ülkekodu';
      },
      phone: (value) => {
        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
      },
      dateOfBirth: (value) => {
        if (!value) return undefined;

        return /^[0-9]+$/.test(value.toString()) ? null : 'Sadece rakam girebilirsiniz';
      },
      deleteMessageTitle: (value) => {

        if (!form.values.isActive) {

          return value && value.trim().length > 5 ? null : 'Mesaj en az 5 karakter olmalı.';
        }

        return null;
      },
    },
  });

   const openDialog = (value: FormValues) => {

    if (value) {
      form.reset();
      // Önce initial values'ı set et
      form.setValues((value));

      form.setInitialValues((value));
      // Sonra form values'larını set et

      open();

    }
  }

  const isDisabledRoleComponent = useMemo(() => {
    return currentUser?.roleId != 1; // admin roleId
  }, [currentUser?.roleId]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);

    const newUserValue = {
      ...omit(['createdDate', 'updateDate'], values),
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined )),
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      roleId: values.roleId ? parseInt(values.roleId) : undefined,
    }

    const result = await service.updateUser(newUserValue);

    if (result == true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      form.reset();
      
      close();
      setIsDisabledSubmit(false);

      return;
    }
    if (result?.data == false && result?.errors) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

   // Ülke değiştiğinde ili sıfırla
  useEffect(() => {
    if (form.values.countryId != form.getInitialValues().countryId) {
      // Ülke değiştiğinde ili resetle
      form.setFieldValue('provinceId', "");
    }
  }, [form.values.countryId]);

  const confirmDialogHandleConfirm = () => {
    // Silme işlemini burada yapın
    confirmModalRef.current?.close();
    form.reset();
    close();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      form.reset();
      close();
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
      title="Kullanıcı Düzenle"
      centered
      size="700"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Ad Soyad"
                placeholder="İsim giriniz"
                value={form.values.fullName}
                required
                {...form.getInputProps('fullName')}
              />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Kimlik"
              value={form.values.identificationNumber}
              placeholder="Kimlik numarası giriniz"
              {...form.getInputProps('identificationNumber')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <CountrySelect
              form={form}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <ProvinceSelect 
              form={form} 
              label="İl" 
              placeholder="İl Seçiniz"
              countryId={form.values.countryId}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <TextInput
              label="Ülke Kodu"
              placeholder="Ülke kodu giriniz"
              value={form.values.countryCode}
              required
              {...form.getInputProps('countryCode')}
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <TextInput
              label="Telefon"
              placeholder="505 555 5555"
              value={form.values.phone}
              required
              {...form.getInputProps('phone')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Doğum Tarih(Yıl)"
              placeholder="Doğum Tarihini giriniz(yıl)"
              value={form.values.dateOfBirth}
              {...form.getInputProps('dateOfBirth')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Email"
              placeholder="Email giriniz"
              required
              value={form.values.email}
              {...form.getInputProps('email')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <PasswordInput
              label="Şifre"
              placeholder="Şifre giriniz"
              required
              {...form.getInputProps('password')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <RoleSelect 
              form={form}
              isDisabled={isDisabledRoleComponent}
            />
          </Grid.Col>
              <Grid.Col span={6}>
                <ModuleSelect
                  form={form}
                  isDisabled={isDisabledRoleComponent}
                  {...form.getInputProps('moduleRoles')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <ResponsibleSelect
                  form={form}
                  isDisabled={isDisabledRoleComponent}
                  {...form.getInputProps('responsibilities')}
                />
              </Grid.Col>
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="flex-end"
            direction="row"
            wrap="wrap">
            <Grid.Col span={6}>
              <Switch 
                label="Kullanıcı Durumu" 
                checked={form.values.isActive}
                onChange={(event) => form.setFieldValue('isActive', event.currentTarget.checked)}
              />
            </Grid.Col>
          </Flex>

          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Silme nedeni"
              placeholder="messaj..."
              withAsterisk
              disabled={form.values.isActive}
              {...form.getInputProps('deleteMessageTitle')}
            />
          </Grid.Col>

          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" disabled={isDisabledSubmit} size="xs"  leftSection={<IconCheck size={14} />} radius="xs">
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

export default UserEdit;
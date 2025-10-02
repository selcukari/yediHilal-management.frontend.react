import { forwardRef, useMemo, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, PasswordInput, Select, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { last } from 'ramda';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { RoleSelect } from '../addOrEdit/roleSelect';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';
import { DutySelect } from '../addOrEdit/dutySelect';
import { ModuleSelect } from '../addOrEdit/moduleSelect';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useAuth } from '~/authContext';

export type UserAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

interface DutiesType {
  ids: string;
  names?: string;
  createDate: string;
  authorizedPersonId: number; // yetkili kişi tarafından atandı id
  authorizedPersonName: string; // yetkili kişi tarafından atandı name
}

type FormValues = {
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  isActive: boolean;
  hierarchy?: string | null;
  countryId: string;
  provinceId: string;
  password: string;
  moduleRoles: string;
  roleId: string;
  dutiesIds?: string;
  deleteMessageTitle?: string;
};
type GetUserData = {
  id: string;
  fullName: string;
}

const UserAdd = forwardRef<UserAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [userData, setUserData] = useState<GetUserData[]>([]);
  // Sadece sancaktar id tutmak için ve sube baskanının uyelerini eklemek icin
  const [sancaktarDutyId, setSancaktarDutyId] = useState<string>("10");
  const [branchHeadDutyId, setBranchHeadDutyIdDutyId] = useState<string>("9");

  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      fullName: '',
      identificationNumber: '',
      email: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: '',
      countryId: '1',
      roleId: '3',
      hierarchy: '',
      moduleRoles: '',
      provinceId: '',
      password: '',
      dutiesIds: '',
      isActive: true,
      deleteMessageTitle: '',
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      password: (value) => (value.trim().length < 5 ? 'Şifre en az 5 karakter olmalı' : null),
      dutiesIds: (value) => ((value && value?.length >= 1) ? null : 'Görev en az 1 tane olmalı'),
      provinceId: (value) => (value ? null : 'İl alanı zorunlu'),
      identificationNumber: (value) => {
        if (!value?.trim()) return null;
        // Sadece rakam kontrolü
        if (!/^[0-9]+$/.test(value)) return 'Sadece rakam girebilirsiniz';

        return null; // Geçerli
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

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Yeni görev verisi
    const newDuty = {
      ids: values.dutiesIds?.toString() ?? "",
      authorizedPersonId: currentUser?.id,
      authorizedPersonName: currentUser?.fullName,
      createDate: formatDate(new Date().toISOString(), dateFormatStrings.dateTimeFormatWithoutSecond)
    };

    const newMemberValue = {
      ...values,
      fullName: values.fullName.trim(),
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined )),
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      roleId: values.roleId ? parseInt(values.roleId) : undefined,
      duties: JSON.stringify([newDuty])
    }

    const result = await service.addUser(newMemberValue);

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
    if (result?.data === false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

   // Ülke değiştiğinde ili sıfırla
  useEffect(() => {
    if (form.values.countryId) {
      // Ülke değiştiğinde ili resetle
      form.setFieldValue('provinceId', '');
    }
  }, [form.values.countryId]);

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
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

  const openDialog = () => {

    setTimeout(() => {
      fetchUsers();
    }, 500);
    form.reset();
  
    open();
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));
  const fetchUsers = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
      }
      const getUsers: any[] | null = await service.users(params);
      
      if (getUsers) {
        const newUsers = getUsers.map(u => ({
          ...u,
          duties: u.duties ? last(JSON.parse(u.duties as string)) : { ids: "", names: "" }
        }));

        setUserData(newUsers.filter(u => u.duties?.ids?.includes(branchHeadDutyId))?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
      } else {
        toast.info('Hiçbir veri yok!');
        setUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };
  const isDisabledRoleComponent = useMemo(() => {
    return currentUser?.roleId != 1; // admin roleId
  }, [currentUser?.roleId]);

  const isDisabledBranchHead = useMemo(() => {
    if (form.values.dutiesIds?.includes(sancaktarDutyId)) {
      return !isDisabledRoleComponent;
    }
    return false;
  },[form.values.dutiesIds]);

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Kullanıcı Ekle"
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
                required
                {...form.getInputProps('fullName')}
              />
            </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Kimlik"
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
              required={true}
              label="İl" 
              placeholder="İl Seçiniz" 
              countryId={form.values.countryId}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <TextInput
              label="Ülke Kodu"
              placeholder="Ülke kodu giriniz"
              required type='number'
              {...form.getInputProps('countryCode')}
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <TextInput
              label="Telefon"
              placeholder="505 555 5555"
              required
              {...form.getInputProps('phone')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Doğum Tarih(Yıl)"
              placeholder="Doğum Tarihini giriniz(yıl)"
              {...form.getInputProps('dateOfBirth')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Email"
              placeholder="Email giriniz"
              required
              type="email"
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
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DutySelect
              form={form}
              required={true}
              {...form.getInputProps('dutiesIds')}
            />
          </Grid.Col>
          { currentUser?.roleId == 1 &&
          <Grid.Col span={6}> 
            <ModuleSelect
              form={form} 
            ></ModuleSelect>
          </Grid.Col> }
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

export default UserAdd;
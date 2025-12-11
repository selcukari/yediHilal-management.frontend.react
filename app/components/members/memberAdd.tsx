import { forwardRef, useEffect, useMemo, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Group, PasswordInput, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../../components/confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { ReferansMemberSelect } from '../addOrEdit/referansMemberSelect';
import { useMemberService } from '../../services/memberService';
import { toast } from '../../utils/toastMessages';
import { MemberTypeSelect } from '../addOrEdit/memberTypeSelect';
import { useAuth } from '~/authContext';
import { DayRenderer } from '../../components';

export type MemberAddDialogControllerRef = {
  open: () => void;
  close: () => void; 
};

interface MemberAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  fullName: string;
  identificationNumber: string;
  email: string;
  password?: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  referenceId: string;
  isActive: boolean;
  createdDate?: string | null;
  isSms: boolean;
  isMail: boolean;
  typeIds: string;
  countryId: string;
  provinceId: string;
  deleteMessageTitle?: string;
};

const MemberAdd = forwardRef<MemberAddDialogControllerRef, MemberAddProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSelect, setIsDisabledSelect] = useState(false);
  const [isDisabledReference, setIsDisabledReference] = useState(false);
  const [isDisabledCountryCode, setIsDisabledCountryCode] = useState(false);
  const [isDisabledPhone, setIsDisabledPhone] = useState(false);
  const [dutyMemberTypeId, setDutyMemberTypeId] = useState<string>('10');
  
  const { currentUser } = useAuth();

  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      fullName: '',
      identificationNumber: '',
      email: '',
      password: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: '',
      referenceId: '',
      typeIds: '1',
      countryId: '1',
      provinceId: '',
      isActive: true,
      isSms: true,
      isMail: true,
      deleteMessageTitle: '',
      createdDate: '',
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      identificationNumber: (value) => {
         if (!value?.trim()) return null;
        // Sadece rakam kontrolü
        if (!/^[0-9]+$/.test(value)) return 'Sadece rakam girebilirsiniz';

        return null; // Geçerli
      },
      email: (value) => {
        if (form.values.isMail) {
          return /^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi';
        }
        if (!value?.trim()) return null;

        return /^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi';
      },
      phone: (value) => {
        if (form.values.isSms) {
          return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
        }

        if (!form.values.referenceId) {

          return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
        }

        return null;
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
      typeIds: (value) => (value ? null : 'Üye tipi alanı zorunlu'),
    },
  });

  // Phone alanını izle ve değişiklik olduğunda isDisabledSelect'i güncelle
  useEffect(() => {
    const phoneValue = form.values.phone;
    setIsDisabledReference(!!phoneValue?.trim()); // Eğer phone değeri varsa true, yoksa false
  }, [form.values.phone]);

  const isUserAdmin = useMemo(() => {
    const result = currentUser?.userType === 'userLogin';
    if (!result) {
      form.setFieldValue('provinceId', currentUser?.provinceId?.toString() as string);
      form.setFieldValue('typeIds', dutyMemberTypeId as string);
    }

    return result;
  }, [currentUser]);

  // reference alanını izle ve değişiklik olduğunda setIsDisabledCountryCode, setIsDisabledPhone'i güncelle
  useEffect(() => {
    const referenceValue = form.values.referenceId;
    setIsDisabledCountryCode(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
    setIsDisabledPhone(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
  }, [form.values.referenceId]);

  const handleSubmit = async (values: FormValues) => {
    const typeIdVoluntarily = "1";

    setIsDisabledSelect(true);
    const newMemberValue = {
      ...values,
      fullName: values.fullName.trim(),
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined )),
      typeIds: values.typeIds ? values.typeIds : typeIdVoluntarily,
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      referenceId: values.referenceId ? parseInt(values.referenceId) : undefined,
      createdDate: values.createdDate ? new Date(values.createdDate).toISOString() : null,
    }

    const result = await service.addMember(newMemberValue);

    if (result == true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      close();
      form.reset();
      setIsDisabledSelect(false);

      return;
    }
    if (result?.data == false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSelect(false);
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
    toast.info("İşlem iptal edildi");
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
      title="Yeni Üye Ekle"
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
            <MemberTypeSelect
              form={form}
              required={true}
              {...form.getInputProps('typeIds')} valueId={isUserAdmin ? null : dutyMemberTypeId}
            ></MemberTypeSelect>
          </Grid.Col>

          <Grid.Col span={6}>
            <CountrySelect 
              form={form} disabled={!isUserAdmin}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <ProvinceSelect 
              form={form} disabled={!isUserAdmin}
              label="İl" placeholder="İl Seçiniz"
              countryId={form.values.countryId}
              valueId={isUserAdmin ? null : currentUser?.provinceId?.toString()}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <TextInput
              label="Ülke Kodu" placeholder="Ülke kodu giriniz" disabled={isDisabledCountryCode}
              type='number' {...form.getInputProps('countryCode')}
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <TextInput
              label="Telefon"
              placeholder="505 555 5555"
              disabled={isDisabledPhone}
              {...form.getInputProps('phone')}
            />
          </Grid.Col>

          <Grid.Col span={6}> 
            <ReferansMemberSelect
              form={form}
              countryId={form.values.countryId}
              isDisabled={isDisabledReference}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Doğum Tarih" placeholder="yıl giriniz(2000)"
              type='number' {...form.getInputProps('dateOfBirth')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Email"
              placeholder="Email giriniz"
              {...form.getInputProps('email')} 
            />
          </Grid.Col>
          <Grid.Col span={6}>
          <PasswordInput
            label="Şifre"
            placeholder="Şifreniz"
            mt="md"
            {...form.getInputProps('password')}
          />
          </Grid.Col>

          <Grid.Col span={6}>
            <fieldset style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
              <legend style={{ padding: '0 8px', fontWeight: 600 }}>Durum Ayarları</legend>
              <Group gap="lg">
                <Switch 
                  label="Üye Durumu" 
                  checked={form.values.isActive}
                  onChange={(event) => form.setFieldValue('isActive', event.currentTarget.checked)}
                />
                <Switch 
                  label="Sms Durumu" 
                  checked={form.values.isSms}
                  onChange={(event) => form.setFieldValue('isSms', event.currentTarget.checked)}
                />
                <Switch 
                  label="Mail Durumu" 
                  checked={form.values.isMail}
                  onChange={(event) => form.setFieldValue('isMail', event.currentTarget.checked)}
                />
              </Group>
            </fieldset>
          </Grid.Col>

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
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="İlk Kayıt Tarihi" placeholder="kayıt tarihi" clearable
              leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('createdDate', value)} locale="tr" renderDay={DayRenderer}
            />
           </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSelect}  leftSection={<IconCheck size={14} />} radius="xs">
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

export default MemberAdd;
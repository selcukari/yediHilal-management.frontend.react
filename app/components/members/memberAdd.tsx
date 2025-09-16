import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Select, Group, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../../components/confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { ReferansMemberSelect } from '../addOrEdit/referansMemberSelect';
import { useMemberService } from '../../services/memberService';
import { toast } from '../../utils/toastMessages';
import { MemberTypeSelect } from '../addOrEdit/memberTypeSelect';

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
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  referenceId: string;
  isActive: boolean;
  isSms: boolean;
  isMail: boolean;
  typeId: string;
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

  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      fullName: '',
      identificationNumber: '',
      email: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: '',
      referenceId: '',
      typeId: '1',
      countryId: '1',
      provinceId: '',
      isActive: true,
      isSms: true,
      isMail: true,
      deleteMessageTitle: '',
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
        if (!value?.trim()) return null;

        return /^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi';
      },
      countryCode: (value) => {
        if (!value?.trim()) return null;

        return /^[0-9]+$/.test(value) ? null : 'Geçersiz ülkekodu';
      },
      phone: (value) => {

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
      typeId: (value) => (value ? null : 'Üye tipi alanı zorunlu'),
    },
  });

  // Phone alanını izle ve değişiklik olduğunda isDisabledSelect'i güncelle
  useEffect(() => {
    const phoneValue = form.values.phone;
    setIsDisabledReference(!!phoneValue?.trim()); // Eğer phone değeri varsa true, yoksa false
  }, [form.values.phone]);

  // reference alanını izle ve değişiklik olduğunda setIsDisabledCountryCode, setIsDisabledPhone'i güncelle
  useEffect(() => {
    const referenceValue = form.values.referenceId;
    setIsDisabledCountryCode(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
    setIsDisabledPhone(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
  }, [form.values.referenceId]);

  const handleSubmit = async (values: FormValues) => {
    const typeIdVoluntarily = 1;

    setIsDisabledSelect(true);
    const newMemberValue = {
      ...values,
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined )),
      typeId: values.typeId ? parseInt(values.typeId) : typeIdVoluntarily,
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      referenceId: values.referenceId ? parseInt(values.referenceId) : undefined,
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
            ></MemberTypeSelect>
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
              disabled={isDisabledCountryCode}
              {...form.getInputProps('countryCode')}
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
              label="Doğum Tarih"
              placeholder="Doğum Tarihini giriniz"
              {...form.getInputProps('dateOfBirth')}
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
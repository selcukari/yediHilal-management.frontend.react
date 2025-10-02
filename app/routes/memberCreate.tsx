import { useRef, useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Container, Flex, Image, Grid, TextInput, Stack, Switch,
  Group, Title, Text, Button, Paper,
} from '@mantine/core';
import { IconCheck, IconCancel } from '@tabler/icons-react';
import ConfirmModal, { type ConfirmModalRef } from '../components/confirmModal';
import ApprovedConfirmModal, { type ApprovedConfirmModalRef } from '../components/approvedConfirmModal';
import { CountrySelect } from '../components/addOrEdit/countrySelect';
import { ProvinceSelect } from '../components/addOrEdit/provinceSelect';
import { ProgramTypeSelect } from '../components/addOrEdit/programTypeSelect';
import { MemberTypeSelect } from '../components/addOrEdit/memberTypeSelect';
import { isEquals } from '~/utils/isEquals';
import { toast } from '../utils/toastMessages';
import { useMemberService } from '../services/memberService';

type FormValues = {
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  isActive: boolean;
  isSms: boolean;
  isMail: boolean;
  typeIds: string;
  countryId: string;
  provinceId: string | null;
  programTypeId: string;
};

export default function MemberCreate() {
   const [isDisabledSelect, setIsDisabledSelect] = useState(false);

    const confirmModalRef = useRef<ConfirmModalRef>(null);
    const approvedConfirmModalRef = useRef<ApprovedConfirmModalRef>(null);
    const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

    const form = useForm<FormValues>({
      initialValues: {
        fullName: '',
        identificationNumber: '',
        email: '',
        countryCode: '90',
        phone: '',
        dateOfBirth: '',
        typeIds: '7',
        countryId: '1',
        provinceId: '',
        programTypeId: "1",
        isActive: true,
        isSms: true,
        isMail: true,
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
        typeIds: (value) => (value ? null : 'Üye tipi alanı zorunlu'),
      },
    });

    const dialogClose = () => {
       if (!isEquals(form.getInitialValues(), form.getValues())) {

        confirmModalRef.current?.open();
      } else {
      
        form.reset();
      }
    }
    
    useEffect(() => {
      if (form.isDirty()) {
        setIsDisabledSelect(false);

        return;
      }

      setIsDisabledSelect(true);
    }, [form.values]);

     const handleSubmit = async (values: FormValues) => {
        const typeIdVoluntarily = "1";
    
        setIsDisabledSelect(true);
        const newMemberValue = {
          ...values,
          fullName: values.fullName.trim(),
          typeIds: values.typeIds ? values.typeIds : typeIdVoluntarily,
          provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
          countryId: values.countryId ? parseInt(values.countryId) : undefined,
          programTypeId: values.programTypeId ? parseInt(values.programTypeId) : null
        }
    
        const result = await service.addExternalMember(newMemberValue);
    
        if (result == true) {
    
          approvedConfirmModalRef.current?.open();
          
          form.reset();
          form.setFieldValue('provinceId', null);
          setIsDisabledSelect(false);
    
          return;
        }
        if (result?.data == false && result?.errors?.length > 0) {
    
          toast.warning(result.errors[0]);
    
        } else {
          toast.error('Bir hata oluştu! Tekrar deneyiniz.');
        }
        setIsDisabledSelect(false);
      };

    const confirmDialogHandleConfirm = () => {
        confirmModalRef.current?.close();
        form.reset();
    };

  const confirmDialogHandleCancel = () => {
   toast.info("İşlem iptal edildi");
  };

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Sayfa Başlığı */}
        <Flex mih={50} gap="md" justify="center" align="flex-end" direction="row" wrap="wrap">
            <Image h={50} w="auto" fit="contain" radius="md" src="https://yedihilal.org/wp-content/uploads/2023/12/yedihilal-yatayLogo.png"/>
        </Flex>
        <Group justify="center" align="center">
          <div>
            <Title order={2}>Üye Oluştur</Title>
            <Text size="sm" c="dimmed">
              Yeni üye ekleyin
            </Text> 
          </div>
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
            <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
            <Grid>
                <Grid.Col span={6}>
                <TextInput
                    label="Ad Soyad" placeholder="İsim giriniz" required
                    {...form.getInputProps('fullName')}
                />
            </Grid.Col>

            <Grid.Col span={6}>
                <TextInput label="Kimlik" placeholder="Kimlik numarası giriniz"
                {...form.getInputProps('identificationNumber')}
                />
            </Grid.Col>

            <Grid.Col span={6}>
                <MemberTypeSelect form={form} required={true}
                {...form.getInputProps('typeIds')}
                ></MemberTypeSelect>
            </Grid.Col>

            <Grid.Col span={6}>
                <CountrySelect form={form} disabled={true} />
            </Grid.Col>

            <Grid.Col span={6}>
                <ProvinceSelect  form={form}  label="İl"  placeholder="İl Seçiniz" required={true} countryId={form.values.countryId} />
            </Grid.Col>
            <Grid.Col span={6}>
                <ProgramTypeSelect  form={form} required={true} />
            </Grid.Col>

            <Grid.Col span={2}>
                <TextInput label="Ülke Kodu" placeholder="Ülke kodu giriniz" required type='number'
                {...form.getInputProps('countryCode')}
                />
            </Grid.Col>

            <Grid.Col span={4}>
                <TextInput
                label="Telefon"
                placeholder="505 555 5555"
                required type='number'
                {...form.getInputProps('phone')}
                />
            </Grid.Col>

            <Grid.Col span={6}>
                <TextInput
                label="Doğum Tarih" placeholder="Doğum Tarihini giriniz(2000)"
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
                <fieldset style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
                <legend style={{ padding: '0 8px', fontWeight: 600 }}>Durum Ayarları</legend>
                <Group gap="lg">
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
          </Paper>
        </div>
      </Stack>
      <ConfirmModal 
        ref={confirmModalRef}
        onConfirm={confirmDialogHandleConfirm}
        onCancel={confirmDialogHandleCancel}/>
     <ApprovedConfirmModal 
        ref={approvedConfirmModalRef}/>
    </Container>
  );
}
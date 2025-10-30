import { useEffect, useState, useRef } from 'react';
import { omit } from 'ramda';
import { TextInput, Button, Stack, Grid, Text, Group, Switch, Textarea, Container, Title, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import ConfirmModal, { type ConfirmModalRef } from '../components/confirmModal';
import { ReferansMemberSelect } from '../components/addOrEdit/referansMemberSelect';
import { CountrySelect } from '../components/addOrEdit/countrySelect';
import { ProvinceSelect } from '../components/addOrEdit/provinceSelect';
import { useMemberService } from '../services/memberService';
import { toast } from '../utils/toastMessages';
import { MemberTypeSelect } from '../components/addOrEdit/memberTypeSelect';
import { isEquals } from '~/utils/isEquals';
import { useAuth } from '~/authContext';

type FormValues = {
  id: number;
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  referenceId: string;
  typeIds: string;
  isActive: boolean;
  sancaktarGorev?: string;
  isSms: boolean;
  isMail: boolean;
  countryId: string;
  provinceId: string;
  createdDate?: string;
  updateDate?: string;
  deleteMessageTitle?: string;
};

const MemberEditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDisabledReference, setIsDisabledReference] = useState(false);
  const [isDisabledCountryCode, setIsDisabledCountryCode] = useState(false);
  const [isDisabledPhone, setIsDisabledPhone] = useState(false);
  const { currentUser } = useAuth();

  const confirmModalRef = useRef<ConfirmModalRef>(null);
  
  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      fullName: '',
      identificationNumber: '',
      email: '',
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
      createdDate: "",
      updateDate: "",
      deleteMessageTitle: '',
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      identificationNumber: (value) => {
        if (!value?.trim()) return null;
        if (!/^[0-9]+$/.test(value)) return 'Sadece rakam girebilirsiniz';
        return null;
      },
      email: (value) => {
        if (form.values.isMail) {
          return /^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi';
        }
        if (!value?.trim()) return null;
        return /^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi';
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
      typeIds: (value) => (value ? null : 'Üye tipi alanı zorunlu'),
    },
  });

  // Üye verilerini yükle
  useEffect(() => {

    if (currentUser?.id as number) {

      loadMemberData(currentUser?.id);
    }
  }, []);

  const loadMemberData = async (memberId: number) => {
    try {
      setLoading(true);
      // Burada API'den üye verilerini çekme işlemi yapılacak
      // Örnek:
      const memberData = await service.member(memberId);
      if (memberData) {
        form.reset();

        form.setValues({
          ...memberData,
          typeIds: memberData.typeIds.toString(),
          sancaktarGorev: memberData.sancaktarGorev ?? "",
          referenceId: memberData.referenceId ? memberData.referenceId.toString() : '',
          countryId: memberData.countryId.toString(),
          provinceId: memberData.provinceId?.toString(),
          deleteMessageTitle: memberData.deleteMessageTitle?.toString(),
        });
        form.setInitialValues({
          ...memberData,
          typeIds: memberData.typeIds.toString(),
          sancaktarGorev: memberData.sancaktarGorev ?? "",
          referenceId: memberData.referenceId ? memberData.referenceId.toString() : '',
          countryId: memberData.countryId.toString(),
          provinceId: memberData.provinceId?.toString(),
          deleteMessageTitle: memberData.deleteMessageTitle?.toString(),
        });
      }
      
    } catch (error) {
      toast.error('Üye verileri yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Phone alanını izle ve değişiklik olduğunda isDisabledSelect'i güncelle
  useEffect(() => {
    const phoneValue = form.values.phone;
    setIsDisabledReference(!!phoneValue?.trim());
  }, [form.values.phone]);

  // reference alanını izle ve değişiklik olduğunda setIsDisabledCountryCode, setIsDisabledPhone'i güncelle
  useEffect(() => {
    const referenceValue = form.values.referenceId;
    setIsDisabledCountryCode(!!referenceValue?.trim());
    setIsDisabledPhone(!!referenceValue?.trim());
  }, [form.values.referenceId]);

  // Ülke değiştiğinde ili sıfırla
  useEffect(() => {
    if (form.values.countryId != form.getInitialValues().countryId) {
      form.setFieldValue('provinceId', "");
    }
  }, [form.values.countryId]);

  const handleSubmit = async (values: FormValues) => {
    const typeIdVoluntarily = "1";
    setLoading(true);

    const newMemberValue = {
      ...omit(['createdDate', 'updateDate'], values),
      fullName: values.fullName.trim(),
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined)),
      typeIds: values.typeIds ? values.typeIds : typeIdVoluntarily,
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      referenceId: values.referenceId ? parseInt(values.referenceId) : undefined,
    }

    const result = await service.updateMember(newMemberValue);
    if (result == true) {
      toast.success('İşlem başarılı!');
      loadMemberData(currentUser?.id);
      setLoading(false);

      return;
    }
    if (result?.data == false && result?.errors?.length > 0) {
      toast.warning(result.errors[0]);
    } else {
      toast.error('Bir hata oluştu!');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    if (!isEquals(form.getInitialValues(), form.getValues())) {
    
      confirmModalRef.current?.open();
    }
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    form.reset();
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Title order={2} mb="xl" ta="center">
          Üye Düzenle
        </Title>

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
                <MemberTypeSelect
                  form={form}
                  required={true}
                  {...form.getInputProps('typeIds')}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <CountrySelect form={form} disabled={true} />
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
                  disabled={isDisabledCountryCode}
                  type='number' 
                  {...form.getInputProps('countryCode')}
                />
              </Grid.Col>

              <Grid.Col span={4}>
                <TextInput
                  label="Telefon" 
                  placeholder="505 555 5555" 
                  value={form.values.phone}
                  disabled={isDisabledPhone}
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <ReferansMemberSelect
                  form={form}
                  memberId={form.values.id?.toString()}
                  countryId={form.values.countryId}
                  isDisabled={isDisabledReference}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TextInput
                  label="Doğum Tarih" 
                  placeholder="yıl giriniz(2000)"
                  value={form.values.dateOfBirth}
                  type='number' 
                  {...form.getInputProps('dateOfBirth')}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TextInput
                  label="Email"
                  placeholder="Email giriniz"
                  value={form.values.email}
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

              {form.values.sancaktarGorev && (
                <Grid.Col span={6}>
                  <Text>Şube/Teşkilat Görevi: {form.values.sancaktarGorev}</Text>
                </Grid.Col>
              )}

              <Grid.Col span={12}>
                <Group justify="flex-end" mt="xl">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    variant="filled" 
                    disabled={loading}
                    leftSection={<IconCheck size={14} />}
                    loading={loading}
                  >
                    Kaydet
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </Stack>
        </form>
      </Paper>
      {/* confirm Dialog */}
        <ConfirmModal 
          ref={confirmModalRef}
          onConfirm={confirmDialogHandleConfirm}
          onCancel={confirmDialogHandleCancel}
        />
    </Container>
  );
};

export default MemberEditPage;
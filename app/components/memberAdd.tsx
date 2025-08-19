import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Select, Group, Switch, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';

export type DialogControllerRef = {
  open: () => void;
  close: () => void;
};

type FormValues = {
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: number;
  reference: string;
  isActive: boolean;
  isSms: boolean;
  isMail: boolean;
  modulRoles: string[];
};

const MemberAdd = forwardRef<DialogControllerRef>((_, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledReference, setIsDisabledReference] = useState(false);
  const [isDisabledCountryCode, setIsDisabledCountryCode] = useState(false);
  const [isDisabledPhone, setIsDisabledPhone] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      fullName: '',
      identificationNumber: '',
      email: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: 0,
      reference: '',
      isActive: true,
      isSms: true,
      isMail: true,
      modulRoles: []
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      identificationNumber: (value) => {
        if (!value?.trim()) return null;
        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
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
        if (!value?.trim()) return null;

        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
      },
      dateOfBirth: (value) => {
        if (!value) return undefined;

        return /^[0-9]+$/.test(value.toString()) ? null : 'Sadece rakam girebilirsiniz';
      }
    },
  });

  // Phone alanını izle ve değişiklik olduğunda isDisabledSelect'i güncelle
  useEffect(() => {
    const phoneValue = form.values.phone;
    setIsDisabledReference(!!phoneValue?.trim()); // Eğer phone değeri varsa true, yoksa false
  }, [form.values.phone]);

  // reference alanını izle ve değişiklik olduğunda setIsDisabledCountryCode, setIsDisabledPhone'i güncelle
  useEffect(() => {
    const referenceValue = form.values.reference;
    setIsDisabledCountryCode(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
    setIsDisabledPhone(!!referenceValue?.trim()); // Eğer reference değeri varsa true, yoksa false
  }, [form.values.reference]);

  const handleSubmit = (values: FormValues) => {
    console.log('Form gönderildi:', values);
    // Burada API çağrısı yapabilirsiniz
    close();
    form.reset();
  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (
    <Modal
      opened={opened}
      onClose={() => {
        close();
        form.reset();
      }}
      title="Yeni Üye Ekle"
      centered
      size="700"
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
            <Select
              label="Referans"
              placeholder="Referans Seçiniz"
              data={[{value: "1", label: 'React' }, {value:"2", label:'Angular'}, {value: "3", label: 'Vue'}]}
              searchable
              maxDropdownHeight={200}
              disabled={isDisabledReference}
              nothingFoundMessage="Nothing found..."
              {...form.getInputProps('reference')}
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
            <MultiSelect
              label="Modül Rolleri"
              placeholder="modül rolleri seciniz"
              data={[{ value: "1", label: 'React'}, { value: "4", label: 'React1'}, { value: "2", label: 'Reac2t'}, { value: "3", label: 'Reac3t'}]}
              searchable
              clearable
              maxDropdownHeight={200}
              {...form.getInputProps('moduleRoles')}
              nothingFoundMessage="Nothing found..."
            />
          </Grid.Col>
          
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs"  leftSection={<IconCheck size={14} />} radius="xs">
              Kaydet
            </Button>
          </Grid.Col>
          </Grid>
        </Stack>
      </form>
    </Modal>
  );
});

export default MemberAdd;
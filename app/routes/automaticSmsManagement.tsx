import { useEffect } from 'react';
import { pick, omit } from 'ramda';
import {
  Container, Paper, Textarea, Switch, Button, Title, Text,
  LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../authContext';
import { toast } from '~/utils/toastMessages';
import { useAutomaticSmsFieldService } from '~/services/automaticSmsFieldService';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { formatDate } from '../utils/formatDate';

type FormValues = {
  id: number;
  message: string;
  isActive: boolean;
  updateDate: string;
}
export default function AutomaticSmsManagement() {
  const { loading: authLoading, isLoggedIn } = useAuth();
  const [visible, { open, close }] = useDisclosure(false);

  const service = useAutomaticSmsFieldService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      message: '',
      isActive: true,
      updateDate: '',
    },
    validate: {
      message: (value) => (value.trim().length < 10 ? 'Mesaj en az 10 karakter olmalı' : null),
    },
  });

  useEffect(() => {
    fetchAutomaticSmsData();
  }, []);

  const fetchAutomaticSmsData = async () => {
    try {
      open();
      const response = await service.getAutomaticSmsFields();

      if (response) {
        console.log("response:", response)
        form.setValues((pick(['id', 'message', 'isActive', 'updateDate'], response) as FormValues));

        form.setInitialValues(pick(['id', 'message', 'isActive', 'updateDate'],response));

        close();
      } else {
        toast.error('No fetchAutomaticSmsData data found');
        close();
      }
    } catch (error: any) {
      console.error('Error fetching fetchAutomaticSmsData:', error.message);
      close();
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      open()
      const result = await service.updateAutomaticSmsFields(omit(['updateDate'], values));
      if (result == true) {
        toast.success('İşlem başarılı!');

        form.setInitialValues(values);
        
        close();
        return;
      } else {
        toast.error('Bir hata oluştu!');
        close();
      }

    } catch (error: any) {
      close()
      toast.error('Bir hata oluştu!');
    }
  };

  return (
    <Container size={420} my={40}>
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Title ta="center" mb="md">Otomatik Sms Alanı</Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        <Text c="dimmed">Son Güncelle: {formatDate(form.values.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Textarea mt="md" withAsterisk mb={4}
            label="Mesaj"
            placeholder="Mesaj giriniz"
            required autosize minRows={10} maxRows={15}
            {...form.getInputProps('message')}
          />

          <Switch 
            label="Aktiflik Durumu" 
            checked={form.values.isActive}
            {...form.getInputProps('isActive')}
          />

          <Button 
            fullWidth 
            mt="xl" 
            type="submit" 
            loading={authLoading}
            disabled={!form.isDirty()}
          >
            Kaydet
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
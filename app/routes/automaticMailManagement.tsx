import { useEffect } from 'react';
import { pick, omit } from 'ramda';
import {
  Container, Paper, TextInput, Switch, Button, Title, Text,
  LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../authContext';
import { toast } from '~/utils/toastMessages';
import { useAutomaticMailFieldService } from '~/services/automaticMailFieldService';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { formatDate } from '../utils/formatDate';
import { RichTextEditorTiptap } from '../components/richTextEditorTiptap';

type FormValues = {
  id: number;
  subject: string;
  body: string;
  isActive: boolean;
  updateDate: string;
  createDate?: string;
}

export default function AutomaticMailManagement() {
  const { loading: authLoading, isLoggedIn } = useAuth();
  const [visible, { open, close }] = useDisclosure(false);

  const service = useAutomaticMailFieldService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      subject: '',
      body: '',
      isActive: true,
      updateDate: '',
      createDate: ''
    },
    validate: {
      subject: (value) => (value.trim().length < 10 ? 'Mesaj en az 10 karakter olmalı' : null),
      body: (value) => {
        const textContent = value.replace(/<[^>]*>/g, '').trim();

        return textContent.length < 10 ? 'Adres en az 10 karakter olmalı' : null;
      }
    },
  });

  useEffect(() => {
    fetchAutomaticMailData();
  }, []);

  const fetchAutomaticMailData = async () => {
    try {
      open();
      const response = await service.getAutomaticMailFields();

      if (response) {
        form.setValues((pick(['id', 'subject', 'isActive', 'updateDate', 'body'], response) as FormValues));
       
        form.setInitialValues(pick(['id', 'subject', 'isActive', 'updateDate', 'body'],response));
        console.log("form.value:", form.values)
       
        close();
      } else {
        close();

        console.error('No fetchMemberTypeData data found');
      }
    } catch (error: any) {
      close();
      console.error('Error fetching fetchMemberTypeData:', error.message);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      open()
      const result = await service.updateAutomaticMailFields(omit(['updateDate', 'createDate'], values));
      if (result == true) {
        toast.success('İşlem başarılı!');
     
        form.setInitialValues(values);
        form.setValues(values);
        
        close();
        return;
      } else {
        close();

      toast.error('Bir hata oluştu!');
    }

    } catch (error: any) {
      close()
      toast.error('Bir hata oluştu!', error.message);
    }
  };

  return (
    <Container size={620} my={40}>
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Title ta="center" mb="md">Otomatik Mail Alanı</Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        <Text c="dimmed">Son Güncelle: {formatDate(form.values.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput mt={4} mb={6}
            label="Konu"
            placeholder="Konu giriniz"
            value={form.values.subject}
            required
            {...form.getInputProps('subject')}
          />

          <Text>İçerik <span style={{ color: 'red' }}>*</span></Text>
            <RichTextEditorTiptap
              form={form}
              required={true}
              value={form.values.body}
              {...form.getInputProps('body')}
            />

          <Switch 
            label="Aktiflik Durumu" mt={4}
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
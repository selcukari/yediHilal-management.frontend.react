import { useEffect, useState, useRef } from 'react';
import { pick, omit } from 'ramda';
import { IconPlus } from '@tabler/icons-react';
import {
  Container, Paper, TextInput, Switch, Button, Title, Text, Flex, Select,
  LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../authContext';
import { toast } from '~/utils/toastMessages';
import { useReadyMessageService } from '~/services/readyMessageService';
import { useAutomaticMailFieldService } from '~/services/automaticMailFieldService';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { formatDate } from '../../utils/formatDate';
import { RichTextEditorTiptap } from '../../components/richTextEditorTiptap';
import ReadyMessageMailAdd, { type ReadyMessageAddDialogControllerRef } from '../../components/automaticSmsManagement/readyMessageMailAdd';

type FormValues = {
  id: number;
  subject: string;
  body: string;
  isActive: boolean;
  updateDate: string;
  createDate?: string;
}

export default function AutomaticMailManagement() {
  const [readyMessage, setReadyMessage] = useState<{ value: string; label: string, body: string }[]>([]);
  const [selectedReadyMessageId, setSelectedReadyMessageId] = useState<string>("");
  const { loading: authLoading, isLoggedIn } = useAuth();
  const [visible, { open, close }] = useDisclosure(false);

  const service = useAutomaticMailFieldService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const serviceReadyMessage = useReadyMessageService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const readyMessageMailAdd = useRef<ReadyMessageAddDialogControllerRef>(null);

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

  const fetchReadyMessage = async () => {
    try {
      const response = await serviceReadyMessage.getReadyMessagesMail();

      if (response) {
        setReadyMessage(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.subject,
            body: c.body
          }))
        );
      } else {
        console.error('No fetchReadyMessage data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetchReadyMessage:', error.message);
    }
  }

  const fetchAutomaticMailData = async () => {
    try {
      open();
      const response = await service.getAutomaticMailFields();

      if (response) {
        form.setValues((pick(['id', 'subject', 'isActive', 'updateDate', 'body'], response) as FormValues));
       
        form.setInitialValues(pick(['id', 'subject', 'isActive', 'updateDate', 'body'],response));
       
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

  useEffect(() => {
    fetchAutomaticMailData();
    fetchReadyMessage();
  }, []);

  const selectedReadyMessage = (value: string | null) => {
    if (value) {
      const getReadyMessage = readyMessage.find(i => i.value == value);
      setSelectedReadyMessageId(value);

      form.setFieldValue('subject', getReadyMessage?.label || "");
      form.setFieldValue('body', getReadyMessage?.body || "");
    }
  }

    const updateReadyMessage = async () => {
      // Form validation kontrolü
  
      if (form.validate()?.hasErrors) {
      
        toast.error('Lütfen formdaki hataları düzeltin');
        return;
      }
  
  
      try {
        open();
        
        // Hazır mesajı kaydetmek için gerekli veriyi hazırla
        const messageData = {
          subject: form.values.subject,
          body: form.values.body,
          // Diğer gerekli alanları buraya ekleyin
          id: parseInt(selectedReadyMessageId),
          automaticMailId: form.values.id
        };
  
        const result = await serviceReadyMessage.updateReadyMessageMail(messageData);
        
        if (result == true) {
          toast.success('Hazır mesaj başarıyla kaydedildi!');
          form.setInitialValues(form.values);
          fetchReadyMessage();
          close();
          return;
        } else {
          toast.error('Hazır mesaj kaydedilirken bir hata oluştu!');
          close();
        }
      } catch (error: any) {
        close();
        toast.error('Hazır mesaj kaydedilirken bir hata oluştu!');
      }
    }

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

  const handleSaveSuccessForReadyMessage = () => {
    fetchReadyMessage();
  }

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
        <Select
          label="Hazır Mesaj" placeholder="mesaj seçiniz"
          data={readyMessage}
          searchable clearable maxDropdownHeight={200} nothingFoundMessage="mesaj bulunamadı..."
          required onChange={(value) => selectedReadyMessage(value)}
        />
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
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="flex-end"
            direction="row"
          wrap="wrap">
            <Button 
            mt="xl" onClick={updateReadyMessage}
            loading={authLoading}
            disabled={!form.isDirty()}
          >
            Hazır Message Kaydet
          </Button>
          <Button 
            variant="filled" 
            p="xs" onClick={() => readyMessageMailAdd.current?.open()}
            loading={authLoading}
          >
            <IconPlus size={18} />
          </Button>

            </Flex>
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
      <ReadyMessageMailAdd  ref={readyMessageMailAdd} onSaveSuccess={handleSaveSuccessForReadyMessage}/>
    </Container>
  );
}
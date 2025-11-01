import { useEffect, useState, useRef } from 'react';
import { pick, omit } from 'ramda';
import { IconPlus  } from '@tabler/icons-react';
import { TimePicker } from '@mantine/dates';
import {
  Container, Paper, Textarea, Flex, Switch, Button, Title, Text, Select,
  LoadingOverlay, TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../authContext';
import { toast } from '~/utils/toastMessages';
import { useAutomaticSmsFieldService } from '~/services/automaticSmsFieldService';
import { useReadyMessageService } from '~/services/readyMessageService';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { formatDate } from '../../utils/formatDate';
import ReadyMessageAdd, { type ReadyMessageAddDialogControllerRef } from '../../components/automaticSmsManagement/readyMessageAdd';

type FormValues = {
  id: number;
  message: string;
  day: number;
  hour: string;
  isActive: boolean;
  updateDate: string;
}
export default function AutomaticSmsManagement() {
  const [readyMessage, setReadyMessage] = useState<{ value: string; label: string }[]>([]);
  const [selectedReadyMessageId, setSelectedReadyMessageId] = useState<string>("");
  const { loading: authLoading } = useAuth();
  const [visible, { open, close }] = useDisclosure(false);

  const serviceReadyMessage = useReadyMessageService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const service = useAutomaticSmsFieldService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const readyMessageAdd = useRef<ReadyMessageAddDialogControllerRef>(null);
  
  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      message: '',
      day: 9,
      hour: "",
      isActive: true,
      updateDate: '',
    },
    validate: {
      message: (value) => (value.trim().length < 10 ? 'Mesaj en az 10 karakter olmalı' : null),
      hour: (value) => (value.trim() ? null : 'Saat alanı zorunlu'),
    },
  });

  const fetchReadyMessage = async () => {
    try {
      const response = await serviceReadyMessage.getReadyMessages();

      if (response) {
        setReadyMessage(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.message,
          }))
        );
      } else {
        console.error('No fetchReadyMessage data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetchReadyMessage:', error.message);
    }
  }

  

  const fetchAutomaticSmsData = async () => {
    try {
      open();
      const response = await service.getAutomaticSmsFields();

      if (response) {
        form.setValues((pick(['id', 'message', 'isActive', 'updateDate', 'day', "hour"], response) as FormValues));

        form.setInitialValues(pick(['id', 'message', 'isActive', 'updateDate', 'day', "hour"],response));

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

  useEffect(() => {
    fetchAutomaticSmsData();
    fetchReadyMessage();
  }, []);

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

  const selectedReadyMessage = (value: string | null) => {
    if (value) {
      const getReadyMessage = readyMessage.find(i => i.value == value)?.label || "";
      setSelectedReadyMessageId(value);

      form.setFieldValue('message', getReadyMessage as string);
    } else {
      setSelectedReadyMessageId("");
    }
  }

  const updateReadyMessage = async () => {
    // Form validation kontrolü

    if (form.validate()?.hasErrors) {
    
      toast.error('Lütfen formdaki hataları düzeltin');
      return;
    }

    if (!selectedReadyMessageId) {
    
      toast.error('Lütfen hazır mesaj seçiniz!');
      return;
    }

    try {
      open();
      
      // Hazır mesajı kaydetmek için gerekli veriyi hazırla
      const messageData = {
        message: form.values.message,
        // Diğer gerekli alanları buraya ekleyin
        id: parseInt(selectedReadyMessageId),
      };

      const result = await serviceReadyMessage.updateReadyMessage(messageData);
      
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

  const handleSaveSuccessForReadyMessage = () => {
    fetchReadyMessage();
  }

  const error = form.errors.hour;

  return (
    <Container size={550} my={40}>
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Title ta="center" mb="md">Otomatik Sms/WhatsApp Alanı</Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        <Text c="dimmed">Son Güncelle: {formatDate(form.values.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond)}</Text>
        <Select
          label="Hazır Mesaj" placeholder="mesaj seçiniz"
          data={readyMessage}
          searchable clearable maxDropdownHeight={200} nothingFoundMessage="mesaj bulunamadı..."
          required onChange={(value) => selectedReadyMessage(value)}
        />
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Textarea mt="md" withAsterisk mb={4}
            label="Mesaj"
            placeholder="Mesaj giriniz"
            required autosize minRows={10} maxRows={15}
            {...form.getInputProps('message')}
          />
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="flex-end"
            direction="row"
            wrap="wrap">
          <TextInput
            label="Ayın Kaçında"
            placeholder="kaçıncı günü"
            {...form.getInputProps('day')}
            type="number" required
            min={1} max={27}
          />
          <TimePicker
            label="Saat" error={error}
            withDropdown
            required
            value={form.values.hour}
            onChange={(val) => form.setFieldValue('hour', val)}
            presets={['09:00', '10:30', '12:00', '13:00', '14:30', '15:00']}
          />
          </Flex>
          <Switch 
            label="Aktiflik Durumu" 
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
            disabled={!form.isDirty()}>
            Hazır Message Kaydet
          </Button>
          <Button 
            variant="filled" 
            p="xs" onClick={() => readyMessageAdd.current?.open()}
            loading={authLoading}>
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
      <ReadyMessageAdd  ref={readyMessageAdd} onSaveSuccess={handleSaveSuccessForReadyMessage}/>
    </Container>
  );
}
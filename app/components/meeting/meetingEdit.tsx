import { forwardRef, useImperativeHandle, useEffect, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, is } from 'ramda';
import { Modal, TextInput, Button, Text, Stack, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { MeetingTypeSelect } from '../addOrEdit/meetingTypeSelect';
import { RichTextEditorTiptap } from '../richTextEditorTiptap';
import { useMeetingService } from '../../services/meetingService';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '../../components';
import { useAuth } from '~/authContext';

export type MeetingEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface MeetingEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  name: string;
  responsibleFullName?: string | null;
  meetingTypeId?: string | null;
  provinceId?: string | null;
  address?: string | null;
  participantCount: number;
  duration?: number;
  agendas: string;
  notes?: string;
  time: string | null;
  files?: any[]; // file
  fileUrls?: string; // kayıtlı fileurls
};

const MeetingEdit = forwardRef<MeetingEditDialogControllerRef, MeetingEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useMeetingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      name: '',
      responsibleFullName: '',
      meetingTypeId: "",
      provinceId: '',
      address: '',
      duration: 1,
      agendas: "",
      participantCount: 5,
      notes: '',
      time: ''
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı başlık en az 5 karakter olmalı' : null),
      responsibleFullName: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      agendas: (value) => (value.trim().length < 10 ? 'Gündemler alanı boş olmaz' : null),
      time: (value) => (value ? null : 'Toplantı zamanı alanı zorunlu'),
    },
  });
  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
      return;
    }
    setIsDisabledSubmit(true);
  }, [form.values]);

  const isUserAdmin = useMemo(() => {
     return currentUser?.userType === 'userLogin';
    }, [currentUser]);

  const openDialog = (value: FormValues) => {

    if (value) {
      form.reset();
      // Önce initial values'ı set et
      form.setValues(value);

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et

      open();

    }
  }

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Dosya form değerlerinden al
    const files = form.values.files || [];
    
    const result = await service.updateMeeting({
      ...values,
      name: values.name.trim(),
      files: files.length > 0 ? files : undefined,
      responsibleFullName: values.responsibleFullName ?? "",
      meetingTypeId: values.meetingTypeId ? parseInt(values.meetingTypeId) : 1,
      provinceId: values.provinceId ? parseInt(values.provinceId) : 1,
    });

    if (result == true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      form.reset();
      
      close();
      setIsDisabledSubmit(false);

      return;
    }
    if (result?.data == false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };


  const confirmDialogHandleConfirm = () => {
    // Silme işlemini burada yapın
    confirmModalRef.current?.close();
    form.reset();
    close();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      form.reset();
      close();
    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));
  const errorTime = form.errors.time;

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Toplantı Düzenle"
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
                label="Toplantı Başlığı"
                placeholder="başlık giriniz"
                value={form.values.name}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <MeetingTypeSelect
                required={true}
                form={form} 
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Sorumlu"
                placeholder="sorumlu giriniz"
                value={form.values.responsibleFullName}
                required
                {...form.getInputProps('responsibleFullName')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ProvinceSelect 
                form={form}
                required={true}
                label="İl" 
                placeholder="İl Seçiniz" 
                countryId={"1"} disabled={!isUserAdmin}
              />
            </Grid.Col>
           <Grid.Col span={6}>
            <TextInput
              label="Katılımcı Sayısı"
              placeholder="sayı giriniz"
              type='number'
              {...form.getInputProps('participantCount')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Gündemler giriniz"
              placeholder="gündemler..."
              withAsterisk
              {...form.getInputProps('agendas')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker
              dropdownType="modal" label="Toplantı Tarihi" placeholder="toplantı tarihi"
              required error={errorTime} clearable minDate={new Date()} locale="tr" renderDay={DayRenderer}
              value={form.values.time} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('time', value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <FileUpload
              form={form}
              required={false}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Adres giriniz"
              placeholder="adres..."
              value={form.values.address}
              withAsterisk
              {...form.getInputProps('address')}
            />
          </Grid.Col>
          <Grid.Col span={10}>
            <Text>Alınan Kararlar <span style={{ color: 'red' }}>*</span></Text>
            <RichTextEditorTiptap
              form={form}
              required={true}
              emitVaue={"notes"}
              {...form.getInputProps('notes')}
            />
          </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" disabled={isDisabledSubmit} size="xs"  leftSection={<IconCheck size={14} />} radius="xs">
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

export default MeetingEdit;
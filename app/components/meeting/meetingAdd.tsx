import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Text, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { PrioritySelect } from '../addOrEdit/prioritySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { MeetingTypeSelect } from '../addOrEdit/meetingTypeSelect';
import { ResponsibleUserSelect } from '../addOrEdit/responsibleUserSelect';
import { useMeetingService } from '../../services/meetingService';
import { toast } from '../../utils/toastMessages'; 
import { RichTextEditorTiptap } from '../richTextEditorTiptap';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '../../components';

export type MeetingAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
  responsibleId?: string | null;
  meetingTypeId?: string | null;
  provinceId?: string | null;
  address?: string | null;
  participantCount: number;
  duration?: number;
  participants: string;
  notes?: string;
  priority: string;
  time: string | null;
  files?: any[];
};

const MeetingAdd = forwardRef<MeetingAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const service = useMeetingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      responsibleId: '',
      meetingTypeId: "",
      provinceId: '',
      address: '',
      duration: 1,
      participants: "",
      participantCount: 5,
      notes: '',
      priority: '',
      files: [],
      time: '',},
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı başlık en az 5 karakter olmalı' : null),
      responsibleId: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      priority: (value) => (value ? null : 'Öncelik alanı zorunlu'),
      participants: (value) => (value.trim().length < 10 ? 'Katılıncı alanı boş olmaz' : null),
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

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Dosya form değerlerinden al
    const files = form.values.files || [];

    const result = await service.addMeeting({
      ...values,
      name: values.name.trim(),
      files: files.length > 0 ? files : undefined,
      responsibleId: values.responsibleId ? parseInt(values.responsibleId) : 1,
      meetingTypeId: values.meetingTypeId ? parseInt(values.meetingTypeId) : 1,
      provinceId: values.provinceId ? parseInt(values.provinceId) : 1,
    });

    if (result === true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      close();
      form.reset();
      setIsDisabledSubmit(false);

      return;
    }
    if (result?.data === false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

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

  const errorTime = form.errors.time;

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Toplantı Ekle"
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
              <ResponsibleUserSelect
                required={true}
                form={form}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ProvinceSelect 
                form={form}
                required={true}
                label="İl" 
                placeholder="İl Seçiniz" 
                countryId={"1"}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <PrioritySelect
                required={true}
                form={form} 
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
              label="Katılıncılar giriniz"
              placeholder="katılıncılar..."
              withAsterisk
              {...form.getInputProps('participants')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Toplantı Tarihi" placeholder="toplantı tarihi" required
              error={errorTime} locale="tr" renderDay={DayRenderer}
              clearable leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              minDate={new Date()}
              onChange={(value) => form.setFieldValue('time', value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
           <Textarea
             mt="md"
             label="Adres giriniz"
             placeholder="adres..."
             withAsterisk
             {...form.getInputProps('address')}
           />
          </Grid.Col>
          <Grid.Col span={6}>
            <FileUpload
              form={form}
              required={false}
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
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
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

export default MeetingAdd;
import { forwardRef, useImperativeHandle, useEffect, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone } from 'ramda';
import { Modal, TextInput, Button, Text, Stack, Grid, Textarea, Stepper, Box, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { DistrictceSelect } from '../addOrEdit/districtSelect';
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
  districtId?: string | null;
  participants?: string | null;
  participantCount: number;
  agendas: string;
  notes?: string;
  time: string | null;
  files?: any[]; // file
  fileUrls?: string; // kayıtlı fileurls
};

const MeetingEdit = forwardRef<MeetingEditDialogControllerRef, MeetingEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeStepper, setActiveStepper] = useState(0);
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
      districtId: '',
      participants: '',
      agendas: "",
      participantCount: 5,
      notes: '',
      time: ''
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı başlık en az 5 karakter olmalı' : null),
      responsibleFullName: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      time: (value) => (value ? null : 'Toplantı zamanı alanı zorunlu'),
      provinceId: (value) => (value ? null : 'İl seçmek zorunlu'),
      agendas: (value) => (value.trim().length < 10 ? 'Gündemler alanı en az 10 karakter olmalı' : null),
      districtId: (value) => (value ? null : 'İlçe seçmek zorunlu'),
      participants: (value) => (value ? null : 'Katılımcı alanı zorunlu'),
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

  // Step validation fonksiyonları
  const validateStep1 = () => {
    const fieldsToValidate = ['name', 'responsibleFullName',
      'districtId', 'meetingTypeId', 'provinceId'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const validateFunc = form.validateField(field);
      if (validateFunc.hasError) {
        isValid = false;
      }
    });

    return isValid;
  };

  const validateStep2 = () => {
    const fieldsToValidate = ['agendas', 'time'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const validateFunc = form.validateField(field);
      if (validateFunc.hasError) {
        isValid = false;
      }
    });

    return isValid;
  };

  const validateStep3 = () => {
    const fieldsToValidate = ['participants'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const validateFunc = form.validateField(field);
      if (validateFunc.hasError) {
        isValid = false;
      }
    });

    return isValid;
  };

  const validateStep4 = () => {
    const fieldsToValidate = ['notes'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const validateFunc = form.validateField(field);
      if (validateFunc.hasError) {
        isValid = false;
      }
    });

    return isValid;
  };

  const nextStep = () => {
    let isValid = true;

    // Aktif step'e göre validation yap
    switch (activeStepper) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      case 3:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setActiveStepper((current) => (current < 3 ? current + 1 : current));
    } else {
      // Validation hatalarını göster
      toast.warning('Lütfen tüm zorunlu alanları doğru şekilde doldurun.');
    }
  };

  const prevStep = () => setActiveStepper((current) => (current > 0 ? current - 1 : current));

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
    // Son step için validation kontrolü
    if (!validateStep4()) {
      toast.warning('Lütfen alınan kararlar alanını doldurun.');
      return;
    }
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
      districtId: values.districtId ? parseInt(values.districtId) : 1,
    });

    if (result == true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      form.reset();
      
      close();
      setActiveStepper(0);
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
    setActiveStepper(0);
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
      setActiveStepper(0);
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
      onClose={dialogClose}
      title="Toplantı Düzenle"
      centered
      size="900"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form>
        <Stack gap="md">
          <Stepper active={activeStepper}>
          <Stepper.Step label="Temel Bilgiler" description="Toplantı temel bilgileri">
          <Box mt="md">
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
            <Grid.Col span={4}>
              <TextInput
                label="Sorumlu"
                placeholder="sorumlu giriniz"
                value={form.values.responsibleFullName}
                required
                {...form.getInputProps('responsibleFullName')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <ProvinceSelect 
                form={form}
                required={true}
                label="İl" 
                placeholder="İl Seçiniz" 
                countryId={"1"} disabled={!isUserAdmin}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <DistrictceSelect 
                form={form}
                required={true}
                provinceId={form.values.provinceId ?? undefined}
              />
            </Grid.Col>
            </Grid>
            </Box>
            </Stepper.Step>
            <Stepper.Step label="Detaylar" description="Toplantı detayları">
            <Box mt="md">
            <Grid>
           <Grid.Col span={4}>
            <TextInput
              label="Katılımcı Sayısı"
              placeholder="sayı giriniz"
              type='number'
              {...form.getInputProps('participantCount')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <DateTimePicker
              dropdownType="modal" label="Toplantı Tarihi" placeholder="toplantı tarihi"
              required error={errorTime} clearable minDate={new Date()} locale="tr" renderDay={DayRenderer}
              value={form.values.time} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('time', value)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Gündemler giriniz"
              placeholder="gündemler..." required
              withAsterisk  autosize minRows={5} maxRows={10}
              {...form.getInputProps('agendas')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <FileUpload
              form={form}
              required={false}
            />
          </Grid.Col>
          </Grid>
          </Box>
          </Stepper.Step>
          <Stepper.Step label="Katılımcılar" description="Katılımcılar alanı">
          <Box mt="md">
          <Grid>
          <Grid.Col span={12}>
            <Textarea
              label="Katılımcı giriniz"
              placeholder="katılımcı..."
              value={form.values.participants}
              withAsterisk  autosize minRows={10} maxRows={15}
              {...form.getInputProps('participants')}
            />
          </Grid.Col>
          </Grid>
          </Box>
          </Stepper.Step>
          <Stepper.Step label="Kararlar" description="Alınan kararlar">
          <Box mt="md">
          <Grid>
          <Grid.Col span={12}>
            <Text>Alınan Kararlar <span style={{ color: 'red' }}>*</span></Text>
            <RichTextEditorTiptap
              form={form}
              required={true}
              emitVaue={"notes"}
              {...form.getInputProps('notes')}
            />
            {form.errors.notes && (
              <Text size="sm" color="red" mt="xs">
                {form.errors.notes}
              </Text>
            )}
          </Grid.Col>
          </Grid>
          </Box>
          </Stepper.Step>
          </Stepper>
          {/* Footer Butonları */}
          <Group justify="flex-end" mt="xl">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={activeStepper === 0}
              leftSection={<IconCancel size={14} />}
              color="red"
            >
              Geri
            </Button>
            <Button 
              variant="filled"
              onClick={activeStepper === 3 ? () => handleSubmit(form.values) : nextStep}
              leftSection={activeStepper === 3 ? <IconCheck size={14} /> : null}
              disabled={isDisabledSubmit && activeStepper === 3}
            >
              {activeStepper === 3 ? "Kaydet" : "İlerle"}
            </Button>
          </Group>
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
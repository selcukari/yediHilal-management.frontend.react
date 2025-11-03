import { forwardRef, useImperativeHandle, useEffect, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Text, Grid, Textarea, Group, Stepper, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { DistrictceSelect } from '../addOrEdit/districtSelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { MeetingTypeSelect } from '../addOrEdit/meetingTypeSelect';
import { useMeetingService } from '../../services/meetingService';
import { toast } from '../../utils/toastMessages'; 
import { RichTextEditorTiptap } from '../richTextEditorTiptap';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '../../components';
import { useAuth } from '~/authContext';

export type MeetingAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void;
}

type FormValues = {
  name: string;
  responsibleFullName?: string | null;
  meetingTypeId?: string | null;
  provinceId?: string | null;
  districtId?: string | null;
  address?: string | null;
  participantCount: number;
  duration?: number;
  agendas: string;
  notes?: string;
  time: string | null;
  files?: any[];
};

const MeetingAdd = forwardRef<MeetingAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [activeStepper, setActiveStepper] = useState(0);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const service = useMeetingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const { currentUser } = useAuth();

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      responsibleFullName: '',
      meetingTypeId: "",
      provinceId: '',
      districtId: '',
      address: '',
      duration: 1,
      agendas: "",
      participantCount: 5,
      notes: '',
      files: [],
      time: '',
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı başlık en az 5 karakter olmalı' : null),
      responsibleFullName: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      agendas: (value) => (value.trim().length < 10 ? 'Gündemler alanı en az 10 karakter olmalı' : null),
      time: (value) => (value ? null : 'Toplantı zamanı alanı zorunlu'),
      meetingTypeId: (value) => (value ? null : 'Toplantı türü seçmek zorunlu'),
      provinceId: (value) => (value ? null : 'İl seçmek zorunlu'),
      districtId: (value) => (value ? null : 'İlçe seçmek zorunlu'),
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
    const result = currentUser?.userType === 'userLogin';
    return result;
  }, [currentUser]);

  // Step validation fonksiyonları
  const validateStep1 = () => {
    const fieldsToValidate = ['name', 'responsibleFullName', 'meetingTypeId',
      'provinceId', 'districtId'];
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
    const fieldsToValidate = ['agendas', 'time', 'duration'];
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
      default:
        isValid = true;
    }

    if (isValid) {
      setActiveStepper((current) => (current < 2 ? current + 1 : current));
    } else {
      // Validation hatalarını göster
      toast.warning('Lütfen tüm zorunlu alanları doğru şekilde doldurun.');
    }
  };

  const prevStep = () => setActiveStepper((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async (values: FormValues) => {
    // Son step için validation kontrolü
    if (!validateStep3()) {
      toast.warning('Lütfen alınan kararlar alanını doldurun.');
      return;
    }

    setIsDisabledSubmit(true);
    const files = form.values.files || [];

    const result = await service.addMeeting({
      ...values,
      name: values.name.trim(),
      responsibleFullName: values.responsibleFullName ?? "",
      files: files.length > 0 ? files : undefined,
      meetingTypeId: values.meetingTypeId ? parseInt(values.meetingTypeId) : 1,
      provinceId: values.provinceId ? parseInt(values.provinceId) : 1,
      districtId: values.districtId ? parseInt(values.districtId) : 1,
    });

    if (result === true) {
      toast.success('İşlem başarılı!');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      close();
      form.reset();
      setActiveStepper(0);
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
    setActiveStepper(0);
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {
      confirmModalRef.current?.open();
    } else {
      close();
      form.reset();
      setActiveStepper(0);
    }
  }

  const openDialog = () => {
    open();
    if (!isUserAdmin) {
      form.setFieldValue('responsibleFullName', currentUser?.fullName as string);
    }
  };

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

  const errorTime = form.errors.time;

  return (
    <>
      <Modal
        opened={opened}
        onClose={dialogClose}
        title="Yeni Toplantı Ekle"
        centered
        size="700"
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
                        required
                        withAsterisk
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
                        required
                        withAsterisk
                        {...form.getInputProps('responsibleFullName')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <ProvinceSelect 
                        form={form}
                        required={true}
                        label="İl" 
                        placeholder="İl Seçiniz"  
                        valueId={isUserAdmin ? null : currentUser?.provinceId?.toString()}
                        countryId={"1"} 
                        disabled={!isUserAdmin}
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
                      <TextInput
                        label="Toplantı Süresi"
                        placeholder="süre(saat)..."
                        withAsterisk type='number'
                        {...form.getInputProps('duration')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <DateTimePicker 
                        dropdownType="modal" 
                        label="Toplantı Tarihi" 
                        placeholder="toplantı tarihi" 
                        required
                        withAsterisk
                        error={errorTime} 
                        locale="tr" 
                        renderDay={DayRenderer}
                        clearable 
                        leftSection={<IconCalendar size={18} stroke={1.5} />} 
                        leftSectionPointerEvents="none"
                        minDate={new Date()}
                        {...form.getInputProps('time')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Gündemler giriniz"
                        placeholder="gündemler..."
                        required
                        withAsterisk 
                        minRows={5}
                        {...form.getInputProps('agendas')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Adres giriniz"
                        placeholder="adres..."
                        minRows={3}
                        {...form.getInputProps('address')}
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

              <Stepper.Step label="Kararlar" description="Alınan kararlar">
                <Box mt="md">
                  <Grid>
                    <Grid.Col span={12}>
                      <Text fw={500} mb="xs">
                        Alınan Kararlar <span style={{ color: 'red' }}>*</span>
                      </Text>
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
                onClick={activeStepper === 2 ? () => handleSubmit(form.values) : nextStep}
                leftSection={activeStepper === 2 ? <IconCheck size={14} /> : null}
                disabled={isDisabledSubmit && activeStepper === 2}
                // loading={isDisabledSubmit}
              >
                {activeStepper === 2 ? "Kaydet" : "İlerle"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmModal 
        ref={confirmModalRef}
        onConfirm={confirmDialogHandleConfirm}
        onCancel={confirmDialogHandleCancel}
      />
    </>
  );
});

export default MeetingAdd;
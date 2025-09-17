import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone } from 'ramda';
import { Modal, TextInput, Flex, Button, Stack, Grid, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { useProjectService } from '../../services/projectService';
import { PrioritySelect } from '../addOrEdit/prioritySelect';
import { ResponsibleUserSelect } from '../addOrEdit/responsibleUserSelect';

export type ProjectEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface UserEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  name: string;
  responsibleId?: string;
  responsibleFullName?: string;
  numberOfParticipant: number;
  note: string;
  isActive: boolean;
  priority: string;
  finisDate?: string | null;
};

const ProjectEdit = forwardRef<ProjectEditDialogControllerRef, UserEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useProjectService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      name: '',
      responsibleId: '',
      responsibleFullName: '',
      numberOfParticipant: 10,
      note: '',
      priority: '',
      isActive: true,
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Proje başlık en az 5 karakter olmalı' : null),
      numberOfParticipant: (value) => (value >= 10 ? null : 'Katılıncı sayısı en az 10 olmalı'),
      priority: (value) => (value ? null : 'Öncelik alanı zorunlu'),
    },
  });


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

    const result = await service.updateProject({
      ...values,
      ...(values.finisDate ? { finisDate: new Date(values.finisDate).toISOString()} : {}),
      responsibleId: undefined,
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

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Kullanıcı Düzenle"
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
                label="Proje Adı"
                placeholder="başlık giriniz"
                value={form.values.name}
                required
                {...form.getInputProps('name')}
              />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Katılımcı Sayısı"
              placeholder="sayı giriniz"
              type='number'
              value={form.values.numberOfParticipant}
              {...form.getInputProps('numberOfParticipant')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <PrioritySelect
              required={true}
              form={form} 
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <ResponsibleUserSelect
              form={form}
              isDisabled
             />
          </Grid.Col>

          <Grid.Col span={6}>
            <DateTimePicker
              dropdownType="modal"
              label="Bitiş Tarihi"
              placeholder="bitiş tarihi"
              required
              clearable
              minDate={new Date()}
              onChange={(value) => form.setFieldValue('finisDate', value)}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Note giriniz"
              placeholder="messaj..."
              withAsterisk
              {...form.getInputProps('note')}
            />
          </Grid.Col>
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="flex-end"
            direction="row"
            wrap="wrap">
            <Grid.Col span={6}>
              <Switch
                label="Proje Durumu" 
                checked={form.values.isActive}
                onChange={(event) => form.setFieldValue('isActive', event.currentTarget.checked)}
              />
            </Grid.Col>
          </Flex>

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

export default ProjectEdit;
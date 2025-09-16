import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { PrioritySelect } from '../addOrEdit/prioritySelect';
import { ResponsibleUserSelect } from '../addOrEdit/responsibleUserSelect';
import { useProjectService } from '../../services/projectService';
import { toast } from '../../utils/toastMessages'; 

export type ProjectAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
  responsibleId?: string | null;
  responsibleFullName?: string | null;
  numberOfParticipant: number;
  note: string;
  isActive: boolean;
  priority: string;
  finisDate?: string | null;
};

const ProjectAdd = forwardRef<ProjectAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const service = useProjectService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
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
      responsibleId: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      numberOfParticipant: (value) => (value >= 10 ? null : 'Katılıncı sayısı en az 10 olmalı'),
      priority: (value) => (value ? null : 'Öncelik alanı zorunlu'),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);

    const result = await service.addProject({
      ...values,
      ...(values.finisDate ? { finisDate: new Date(values.finisDate).toISOString()} : {}),
      responsibleFullName: values.responsibleFullName ? values.responsibleFullName : undefined,
      responsibleId: values.responsibleId ? parseInt(values.responsibleId) : undefined,
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

  const onResponsibleChange = (responsibleValue: string | null, responsibleName?: string | null): void => {
    form.values.responsibleId = responsibleValue;
    form.values.responsibleFullName = responsibleName;

  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Proje Ekle"
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
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Katılımcı Sayısı"
              placeholder="sayı giriniz"
              type='number'
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
              required={true}
              form={form}
              onResponsibleChange={onResponsibleChange}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker
              dropdownType="modal"
              label="Pick date and time"
              placeholder="Pick date and time"
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

export default ProjectAdd;
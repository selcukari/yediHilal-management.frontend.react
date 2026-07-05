import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMeetingTypeService } from '../../services/meetingTypeService';
import { toast } from '../../utils/toastMessages';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type MeetingTypeAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface MeetingTypeAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
};

const MeetingTypeAdd = forwardRef<MeetingTypeAddDialogControllerRef, MeetingTypeAddProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);

  const service = useMeetingTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const queryClient = useQueryClient();
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı Türü Adı en az 5 karakter olmalı' : null),
    },
  });

  const addMeetingTypeMutation = useMutation({
    mutationFn: async (meetingTypeData: FormValues) => {
      return await service.addMeetingType({
        ...meetingTypeData,
        name: meetingTypeData.name.trim()
      });
    },
    onSuccess: (result: any) => {
      if (result === true) {
        toast.success('İşlem başarılı!');
        queryClient.invalidateQueries({ queryKey: ['meetingTypes'] });

        if (onSaveSuccess) onSaveSuccess();
        close();
        form.reset();
      }
      else if (result?.data === false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    },
    onError: () => {
      toast.error('Bir hata oluştu!');
    }
  });

  const handleSubmit = (values: FormValues) => {
    addMeetingTypeMutation.mutate(values);
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

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Toplantı Türü Ekle"
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
            <Grid.Col span={6} offset={3}>
              <TextInput
                label="Toplantı Türü Adı"
                placeholder="toplantı türü giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs"
            disabled={addMeetingTypeMutation.isPending}  leftSection={<IconCheck size={14} />} radius="xs">
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

export default MeetingTypeAdd;
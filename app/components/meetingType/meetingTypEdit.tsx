import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { clone } from 'ramda';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMeetingTypeService } from '../../services/meetingTypeService';
import { toast } from '../../utils/toastMessages';
import { useSignalR } from '../../context/SignalRContext';

export type MeetingTypeEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface MeetingTypeEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  name: string;
};

const MeetingTypeEdit = forwardRef<MeetingTypeEditDialogControllerRef, MeetingTypeEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useMeetingTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const connection = useSignalR();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      name: '',
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Toplantı Türü Adı en az 5 karakter olmalı' : null),
    },
  });

  // 2. SignalR Dinleyicisini Aktif Et
  useEffect(() => {

    if (!connection) return;

   connection.on('ReceiveValueUpdated', (data) => {
    
    // Toast veya state güncellemesi
    toast.success('İşlem başarılı! ' + data.valueName);
  });

    // Bileşen kapandığında (unmount) dinleyiciyi kaldırmazsanız memory leak oluşur ve mükerrer dinler.
    return () => {
      connection.off('ReceiveValueUpdated');
    };
  }, [connection]);


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

  const updateMeetingTypeMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await service.updateMeetingType({
        ...values,
      name: values.name.trim()
      });
    },
    onSuccess: (result: any) => {
      if (result === true) {

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

  const handleSubmit = async (values: FormValues) => {
    updateMeetingTypeMutation.mutate(values);
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

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

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
      title="Toplantı Türü Düzenle"
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
                value={form.values.name}
                required
                {...form.getInputProps('name')}
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

export default MeetingTypeEdit;
import { forwardRef, useImperativeHandle, useEffect, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Textarea, Button, Stack, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useReadyMessageService } from '../../services/readyMessageService';
import { toast } from '../../utils/toastMessages';
import { useSignalR } from '../../context/SignalRContext';

export type ReadyMessageAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface SancaktarAddProps {
  onSaveSuccess?: () => void;
}

type FormValues = {
  message: string;
};

const ReadyMessageAdd = forwardRef<ReadyMessageAddDialogControllerRef, SancaktarAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  
  const service = useReadyMessageService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const connection = useSignalR();

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      message: '',
    },
    validate: {
      message: (value) => (value.trim().length < 10 ? 'Mesaj Adı en az 10 karakter olmalı' : null),
    },
  });

  const addReadyMessageMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await service.addReadyMessage(values);
    },
    onSuccess: (result: any) => {
      if (result === true) {
        // onSaveSuccess event'ini tetikle
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        close();
        form.reset();
        setIsDisabledSubmit(false);
      }
      else if (result?.data === false && result?.errors?.length > 0) {
        toast.warning(result.errors[0]);
      } else {
        toast.error('Bir hata oluştu!');
      }
    }
  });

    // 2. SignalR Dinleyicisini Aktif Et
    useEffect(() => {
      if (!connection) return;
  
      connection.on('ReceiveValueCreated', (data) => {
        // Ekrana anlık olarak listeye ekliyoruz (Kullanıcı sayfayı yenilemeden görür)
        toast.success('İşlem başarılı! ' + data.valueName);
      });
  
      // Bileşen kapandığında (unmount) dinleyiciyi kaldırmazsanız memory leak oluşur ve mükerrer dinler.
      return () => {
        connection.off('ReceiveValueCreated');
      };
    }, [connection]);

  const handleSubmit = (values: FormValues) => {
    addReadyMessageMutation.mutate(values);
    };

  useEffect(() => {
    if (form.isDirty()) {

      setIsDisabledSubmit(false);
      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

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
      title="Yeni Hazır Mesaj Ekle"
      centered
      size="500"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={12}>
              <Textarea mt="md" withAsterisk mb={4}
                label="Mesaj"
                placeholder="Mesaj giriniz"
                required autosize minRows={5} maxRows={15}
                {...form.getInputProps('message')}
              />
            </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={addReadyMessageMutation.isPending || isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
              Ekle
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

export default ReadyMessageAdd;
import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Textarea, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useDocumentTrackingService } from '../../services/documentTrackingService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';
import { useAuthStore } from '~/authContext';
import { useSignalR } from '../../context/SignalRContext';

export type DocumentTrackingAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface DocumentTrackingAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
  note?: string | null;
  files?: any[];
};

const DocumentTrackingAdd = forwardRef<DocumentTrackingAddDialogControllerRef, DocumentTrackingAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const connection = useSignalR();
  
  const service = useDocumentTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const queryClient = useQueryClient();
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuthStore();

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      note: "",
      files: [],
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Belge Adı en az 5 karakter olmalı' : null),
      files: (value) => {
        return value && value?.length > 0 ? null : 'En az bir tane dosya eklenmeli';
      },
    },
  });
    // 2. SignalR Dinleyicisini Aktif Et
  useEffect(() => {

    if (!connection) return;

   connection.on('ReceiveValueCreated', (data) => {
    
    // Toast veya state güncellemesi
    toast.success('İşlem başarılı! ' + data.valueName);
  });

    // Bileşen kapandığında (unmount) dinleyiciyi kaldırmazsanız memory leak oluşur ve mükerrer dinler.
    return () => {
      connection.off('ReceiveValueCreated');
    };
  }, [connection]);

  const addDocumentTrackingMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const files = form.values.files || [];

      return await service.addDocumentTracking({
        ...values,
        files: files.length > 0 ? files : undefined,
        responsibleId: currentUser?.id?.toString() as string,
        responsibleFullName: currentUser?.fullName as string,
        responsiblePhone: `${currentUser?.countryCode}${currentUser?.phone}` as string,
      });
    },
    onSuccess: (result: any) => {
      if (result === true) {

        queryClient.invalidateQueries({ queryKey: ['documentTrackings'] });

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
    addDocumentTrackingMutation.mutate(values);
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
  };

  const confirmDialogHandleCancel = () => {
    toast.info('İşlem iptal edildi');
  };
  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

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
      title="Yeni Evrak Ekle"
      centered
      size="400"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Flex
              mih={50}
              gap="md"
              justify="center"
              align="center"
              direction="row"
              wrap="wrap">
            <Grid.Col span={10}>
              <TextInput
                label="Evrak Adı"
                placeholder="evrak adı giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
          <Grid.Col span={10}>
            <Textarea
              mt="md" label="Note" placeholder="note..."
              withAsterisk minRows={5}
              {...form.getInputProps('note')}
            />
          </Grid.Col>
          <Grid.Col span={10}>
            <FileUpload
              form={form}
              required={true}
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

export default DocumentTrackingAdd;
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { useWarehouseService } from '../../services/warehouseService';
import { useAuthStore } from '~/authContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignalR } from '../../context/SignalRContext';

export type WarehouseEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface WareEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  name: string;
  description?: string;
  actions?: string;
};

const WarehouseEdit = forwardRef<WarehouseEditDialogControllerRef, WareEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const connection = useSignalR();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      updateUserId: 0,
      updateUserFullName: '',
      name: '',
      description: '',
    },
    validate: {
       name: (value) => {
        if(value.trim().length < 5 ) {
          return "Ürün Adı en az 5 karakter olmalı";
        }

        return null;
      },
    },
  });
    useEffect(() => {
  
      if (!connection) return;
  
     connection.on('ReceiveValueUpdated', (data: any) => {
      
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
  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

  const updateWarehouseMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const newWarehouseValue = {
        ...(omit(['updateUserFullName'], values)),
        updateUserId: currentUser?.id as number,
      }

      return await service.updateWarehouse(newWarehouseValue);
    },
    onSuccess: (result: any) => {
    if (result === true) {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "duties"] });

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
    updateWarehouseMutation.mutate(values);
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
      title="Stok Düzenle"
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
                label="Depo Adı"
                placeholder="Depo adı giriniz"
                value={form.values.name}
                required
                {...form.getInputProps('name')}
              />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Açıklama"
              placeholder="messaj..."
              withAsterisk
              value={form.values.description}
              {...form.getInputProps('description')}
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

export default WarehouseEdit;
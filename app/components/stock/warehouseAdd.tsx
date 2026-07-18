import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useWarehouseService } from '../../services/warehouseService';
import { toast } from '../../utils/toastMessages';
import { useAuthStore } from '~/authContext';
import { useSignalR } from '../../context/SignalRContext';

export type WarehouseAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface WarehouseAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}


type FormValues = {
  updateUserId: number;
  updateUserFullName: string;
  name: string;
  description?: string;
};

const WarehouseAdd = forwardRef<WarehouseAddDialogControllerRef, WarehouseAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const connection = useSignalR();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      updateUserId: 0,
      updateUserFullName: '',
      name: '',
      description: '',
   
    },
    validate: {
      name: (value) => {
        if(value.trim().length < 5 ) {
          return "Depo Adı en az 5 karakter olmalı";
        }

        return null;
      },
    },
  });
    useEffect(() => {
    
        if (!connection) return;
    
       connection.on('ReceiveValueCreated', (data: any) => {
        
        // Toast veya state güncellemesi
        toast.success('İşlem başarılı! ' + data.valueName);
      });
    
        // Bileşen kapandığında (unmount) dinleyiciyi kaldırmazsanız memory leak oluşur ve mükerrer dinler.
        return () => {
          connection.off('ReceiveValueCreated');
        };
      }, [connection]);

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);

      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  const addWarehousesMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const newWarehouseValue = {
      ...(omit(['updateUserFullName'], values)),
      updateUserId: currentUser?.id as number,
    }
      return await service.addWarehouse(newWarehouseValue);
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
    addWarehousesMutation.mutate(values);
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
      title="Yeni Depo Ekle"
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
              {...form.getInputProps('description')}
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

export default WarehouseAdd;
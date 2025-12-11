import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useWarehouseService } from '../../services/warehouseService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';

export type ShelveAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface ShelveAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  updateUserId: number;
  updateUserFullName: string;
  name: string;
  warehouseId: string | null;
  rowsMax: number;
  columnsMax: number;
  description?: string;
};

const ShelveAdd = forwardRef<ShelveAddDialogControllerRef, ShelveAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);

  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      updateUserId: 0,
      updateUserFullName: '',
      name: '',
      description: '',
      warehouseId: "",
      rowsMax: 0,
      columnsMax: 0,
    },
    validate: {
      name: (value) => {
        if(value.trim().length < 5 ) {
          return "Depo Adı en az 5 karakter olmalı";
        }

        return null;
      },
      warehouseId: (value) => {
        if(!value) {
          return "Lütfen bir depo seçiniz";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);

      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      const response = await service.getWarehouses();

      if (response) {
        setWarehouses(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No setWarehouses data found');
      }
    } catch (error: any) {
      console.error('Error fetching countries:', error.message);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newShelveValue = {
      ...(omit(['updateUserFullName'], values)),
      updateUserId: currentUser?.id as number,
      warehouseId: values.warehouseId ? parseInt(values.warehouseId, 10) : undefined,
    }

    const result = await service.addShelve(newShelveValue);

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
      title="Yeni Raf Ekle"
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
                label="Raf Adı"
                placeholder="Raf adı giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Depo" placeholder="depo seçiniz" data={warehouses}
                searchable maxDropdownHeight={200} value={form.values.warehouseId}
                nothingFoundMessage="depo bulunamadı..." required
                onChange={(value) => form.setFieldValue('warehouseId', value)}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Raf max Satır Sayısı"
                placeholder="satır giriniz"
                required min={1} type='number'
                {...form.getInputProps('rowsMax')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Raf max Sütun Sayısı"
                placeholder="sütun giriniz"
                required type='number' min={1}
                {...form.getInputProps('columnsMax')}
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

export default ShelveAdd;
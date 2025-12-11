import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { useWarehouseService } from '../../services/warehouseService';
import { useAuth } from '~/authContext';

export type ShelveEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface ShelveEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  name: string;
  description?: string;
  warehouseId: string | null;
  rowsMax: number;
  columnsMax: number;
  actions?: string;
};

const WarehouseEdit = forwardRef<ShelveEditDialogControllerRef, ShelveEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);

  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
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
          return "Ürün Adı en az 5 karakter olmalı";
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


  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);

    const newShelveValue = {
      ...(omit(['updateUserFullName'], values)),
      updateUserId: currentUser?.id as number,
      warehouseId: values.warehouseId ? parseInt(values.warehouseId, 10) : undefined,
    }

    const result = await service.updateShelve(newShelveValue);

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
      title="Raf Düzenle"
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
                value={form.values.name}
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
              value={form.values.rowsMax}
              placeholder="satır giriniz"
              required min={1} type='number'
              {...form.getInputProps('rowsMax')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Raf max Sütun Sayısı"
              value={form.values.columnsMax}
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
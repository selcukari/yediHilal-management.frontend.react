import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit, product } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Flex, Group, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { useWarehouseService } from '../../services/warehouseService';
import { statuMockData } from '~/utils/priorityMockData';
import { useAuth } from '~/authContext';

export type RequestStockEditManagerDialogControllerRef = {
  openDialog: (value: FormValues[]) => void;
  close: () => void;
};

interface RequestStockEditManagerProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  productId: number;
  productName: string;
  count: string;
  status: string;
  managerNote?: string;
  description?: string;
  actions?: string;
};

const RequestStockEditManager = forwardRef<RequestStockEditManagerDialogControllerRef, RequestStockEditManagerProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);

  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const service = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuth();

  const form = useForm<{items: FormValues[]}>({
    initialValues: {
      items: [{
      id: 0,
      productId: 0,
      productName: '',
      description: '',
      managerNote: '',
      status: '',
      count: "",
      }],
    },
    validate: {
    },
  });

  const openDialog = (value: FormValues[]) => {
    if (value && value.length > 0) {
      form.reset();

      // Önce initial values'ı set et
      form.setValues({items: value});

      form.setInitialValues({
        items: clone(value)});
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


  const handleSubmit = async (values: { items: FormValues[] }) => {
    setIsDisabledSubmit(true);

    const results = await Promise.all(
      values.items.map(item => {
        const payload = {
          ...(omit(['productName'], item)),
          id: item.id,
          productId: item.productId,
          status: values.items[0].status,
          managerNote: item.managerNote,
          count: parseInt(item.count, 10),
          // Yönetici ID'sini currentUser'dan alıyoruz
          managerUserId: currentUser?.id as number
        };
        return service.updatRequestStock(payload);
      })
    );

    const failedResult = results.find(r => r !== true);

    if (!failedResult) {
      toast.success('Tüm işlemler başarıyla tamamlandı!');
      onSaveSuccess?.();
      form.reset();
      close();
    } else {
      toast.warning(
        failedResult?.errors?.[0] ?? 'Bazı kayıtlar güncellenemedi!'
      );
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
      title="Ürün Talep Düzenle"
      centered
      size="900"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {form.values.items.map((item, index) => (
          <Grid key={item.id}>
            <Grid.Col span={2}>
              <TextInput
                label="Ürün"
                disabled
                {...form.getInputProps(`items.${index}.productName`)}
              />
            </Grid.Col>

            <Grid.Col span={1.5}>
              <TextInput
                label="Adet/Miktar"
                type="number"
                min={1}
                required
                {...form.getInputProps(`items.${index}.count`)}
              />
            </Grid.Col>

            <Grid.Col span={3}>
              <Textarea
                label="Açıklama/Talep Neden" disabled
                {...form.getInputProps(`items.${index}.description`)}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <Select
                data={statuMockData} label="Durum"
                maxDropdownHeight={200}
                {...form.getInputProps(`items.${index}.status`)}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Textarea
                label="Açıklama/Yönetici Notu"
                {...form.getInputProps(`items.${index}.managerNote`)}
              />
            </Grid.Col>
          </Grid>
        ))}
        <TextInput
          label="Açıklama/Genel Not"
          required disabled
          {...form.getInputProps(`items.0.note`)}
        />
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 'sm', sm: 'lg' }}
          justify={{ sm: 'center' }}
        >
        <Select
          data={statuMockData}
          maxDropdownHeight={200}
          {...form.getInputProps(`items.0.status`)}
        />
        </Flex>
        <Group justify="end">
          <Button
            variant="filled"
            color="red"
            onClick={dialogClose}
            leftSection={<IconCancel size={14} />}
          >
            İptal
          </Button>

          <Button
            type="submit"
            disabled={isDisabledSubmit}
            leftSection={<IconCheck size={14} />}
          >
            Kaydet
          </Button>
        </Group>
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

export default RequestStockEditManager;
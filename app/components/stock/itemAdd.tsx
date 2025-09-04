import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, PasswordInput, Group, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';
import stripSpecialCharacters from '../../utils/stripSpecialCharacters';

export type ItemAddDialogControllerRef = {
  openDialog: (value: any) => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

interface StockDataParams {
  id: number;
  updateUserId: number;
  items?: string;
}

type FormValues = {
  name: string;
  count: string;
};

const ItemAdd = forwardRef<ItemAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  type StockData = {
    id: number;
    items: { key: string }[];
  };
  
  const [stockData, setStockData] = useState<StockData>({ items: [], id: 0 });
  const [opened, { open, close }] = useDisclosure(false);
  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      count: '',
   
    },
    validate: {
      name: (value) => {
        if(value.trim().length < 5 ) {
          return "İsim en az 5 karakter olmalı";
        }

        const keys = stockData?.items.map((item: any) => item.key);

        if(keys.includes(stripSpecialCharacters(value))) {

          return "Aynı item tekrar eklenemez";
        }
      },
      count: (value) => {

        return parseInt(value) <= 0 ? "En az 1 olmalıdır": null
      },
    },
  });

  useEffect(() => {
    if (form.isValid()) {
      setIsDisabledSubmit(false);

      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  const randaomColor = () => {
    const colors = ["dark", "gray", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"];
    const index = Math.floor(Math.random() * colors.length);

    return colors[index];
  }

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newStockValue: StockDataParams = {
      id: stockData.id,
      updateUserId: currentUser?.id as number,
      items: JSON.stringify([
        // ...stockData.items,
        {
          key: stripSpecialCharacters(values.name.trim()),
          name: values.name.trim(),
          count: parseInt(values.count),
          color: randaomColor()
        }
      ])
    }

    const result = await service.updateStock(newStockValue);

    if (result) {

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
    if (result?.data === false && result?.errors) {

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

  const openDialog = (value: any) => {

    if (value) {
      form.reset();
      setStockData(value);
      open();

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
      title="Yeni İtem Ekle"
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
                label="İtem Adı"
                placeholder="İtem adı giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="İtem sayısı"
              placeholder="item sayısı giriniz"
              type='number'
              required
              {...form.getInputProps('count')}
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

export default ItemAdd;
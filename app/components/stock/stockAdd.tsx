import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';
import stripSpecialCharacters from '../../utils/stripSpecialCharacters';
import { DayRenderer } from '../../components';

export type StockAddDialogControllerRef = {
  openDialog: (values: GetDtockData[]) => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type GetDtockData = {
  id: number;
  name: string;
  nameKey: string;
}

type FormValues = {
  updateUserId: number;
  updateUserFullName: string;
  expirationDate?: string | null;
  name: string;
  nameKey: string;
  isActive: boolean;
  unitPrice?: string;
  totalPrice?: number;
  count?: string;
  description?: string;
  fromWhere?: string;
};

const StockAdd = forwardRef<StockAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [stockData, setStockData] = useState<GetDtockData[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      updateUserId: 0,
      updateUserFullName: '',
      expirationDate: '',
      name: '',
      nameKey: '',
      isActive: true,
      unitPrice: "1",
      totalPrice: 1,
      count: "1",
      description: '',
      fromWhere: 'Bim Market',
   
    },
    validate: {
      name: (value) => {
        if(value.trim().length < 5 ) {
          return "Ürün Adı en az 5 karakter olmalı";
        }

        const keys = stockData?.map((item: GetDtockData) => item.nameKey);

        if(keys.includes(stripSpecialCharacters(value))) {

          return "Aynı item tekrar eklenemez";
        }
      },
      unitPrice: (value) => {
        return (value && parseInt(value) > 0) ? null: "Birim fiyatı en az 1 olmalıdır"
      },
      count: (value) => {

        return (value && parseInt(value) > 0) ? null : "Toplam sayı en az 1 olmalıdır"
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

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newStockValue = {
      ...(omit(['updateUserFullName'], values)),
      totalPrice: (parseInt(values.unitPrice || "1")) * (parseInt(values.count || "1")),
      unitPrice: parseInt(values.unitPrice || "1"),
      count: parseInt(values.count || "1"),
      updateUserId: currentUser?.id as number,
      nameKey: stripSpecialCharacters(values.name)
    }

    const result = await service.addStock(newStockValue);

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
 const openDialog = (values: GetDtockData[]) => {

    if (values?.length > 0) {
      form.reset();
      setStockData(values);
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
      title="Yeni Ürün Ekle"
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
                label="Ürün Adı"
                placeholder="Ürün adı giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
            <TextInput
              label="Birim fiyatı"
              placeholder="fiyat giriniz"
              type='number'
              required
              min={1}
              {...form.getInputProps('unitPrice')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="İtem sayısı"
              placeholder="item sayısı giriniz"
              type='number'
              required
              min={1}
              {...form.getInputProps('count')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Toplam Fiyat"
              type='number'
              disabled
              min={1}
              value={(parseInt(form.values.unitPrice ?? "1")) * (parseInt(form.values.count ?? "1"))}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Nereden alındı"
              placeholder="yer giriniz"
              {...form.getInputProps('fromWhere')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Son Kullanma Tarihi" placeholder="son tarihi" required clearable
              minDate={new Date()} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('expirationDate', value)} locale="tr" renderDay={DayRenderer}
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

export default StockAdd;
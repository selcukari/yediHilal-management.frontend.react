import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { clone, omit } from 'ramda';
import { Modal, TextInput, Button, Stack, Select, Grid, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { toast } from '../../utils/toastMessages';
import { useWarehouseService } from '../../services/warehouseService';
import { useStockService } from '../../services/stockService';
import { useAuth } from '~/authContext';
import { DayRenderer } from '../../components';

export type StockEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface UserEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  expirationDate?: string | null;
  name: string;
  nameKey: string;
  isActive: boolean;
  unitPrice?: string;
  totalPrice?: number;
  count?: string;
  shelveId: string | null;
  place: string;
  warehouseId: string | null;
  description?: string;
  fromWhere?: string;
  actions?: string;
};

const StockEdit = forwardRef<StockEditDialogControllerRef, UserEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [shelves, setShelves] = useState<{ value: string; label: string; warehouseId: string }[]>([]);
  const [shelvesChange, setShelvesChange] = useState<{ value: string; label: string; warehouseId: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);

  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const serviceWarehouse = useWarehouseService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      updateUserId: 0,
      updateUserFullName: '',
      expirationDate: '',
      name: '',
      nameKey: '',
      isActive: true,
      unitPrice: "1",
      shelveId: null,
      place: '',
      warehouseId: null,
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


        return null;
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
    fetchWarehouseData();
    fetchShelves();
  }, []);

  // depo değiştiğinde raf sıfırla ve rafları yeniden yükle
  useEffect(() => {
    // depo değiştiğinde ili resetle
    form.setFieldValue('shelveId', null);

    const filteredShelves = shelves.filter(shelf => shelf.warehouseId == form.values.warehouseId);
    setShelvesChange(filteredShelves);
  }, [form.values.warehouseId]);
  
  const fetchWarehouseData = async () => {
    try {
      const response = await serviceWarehouse.getWarehouses();
        if (response) {
         setWarehouses(
           response.map((c: any) => ({
             value: String(c.id),
             label: c.name,
             warehouseId: String(c.warehouseId),
           }))
         );
       } else {
         console.error('No setWarehouses data found');
        }
     } catch (error: any) {
      console.error('Error fetching countries:', error.message);
     }
   };
   const fetchShelves = async () => {
    try {
      const response = await serviceWarehouse.getShelves();
        if (response) {
         setShelves(
           response.map((c: any) => ({
             value: String(c.id),
             label: c.name,
             warehouseId: String(c.warehouseId),
           }))
         );
       } else {
         console.error('No fetchShelves data found');
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

    const newStockValue = {
      ...(omit(['updateUserFullName'], values)),
      totalPrice: (parseInt(values.unitPrice || "1")) * (parseInt(values.count || "1")),
      unitPrice: parseInt(values.unitPrice || "1"),
      count: parseInt(values.count || "1"),
      updateUserId: currentUser?.id as number,
      shelveId: values.shelveId ? parseInt(values.shelveId, 10) : undefined,
      warehouseId: values.warehouseId ? parseInt(values.warehouseId, 10) : undefined,
    }

    const result = await service.updateStock(newStockValue);

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
                label="Ürün Adı"
                placeholder="Ürün adı giriniz"
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
              <Select
                label="Raf" placeholder="Raf seçiniz" data={shelvesChange}
                searchable maxDropdownHeight={200} value={form.values.shelveId}
                nothingFoundMessage="raf bulunamadı..." required disabled={!form.values.warehouseId}
                onChange={(value) => form.setFieldValue('shelveId', value)}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Ürün yeri"
                placeholder="(10) yeri..."
                value={form.values.place}
                required 
                {...form.getInputProps('place')}
              />
            </Grid.Col>
            <Grid.Col span={6}></Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Birim fiyatı"
              placeholder="fiyat giriniz(₺)"
              type='number'
              min={1}
              value={form.values.unitPrice}
              {...form.getInputProps('unitPrice')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Ürün sayısı"
              placeholder="item sayısı giriniz"
              type='number'
              min={1}
              value={form.values.count}
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
              value={form.values.fromWhere}
              {...form.getInputProps('fromWhere')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Son Kullanma Tarihi" placeholder="son tarihi" required clearable value={form.values.expirationDate}
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

export default StockEdit;
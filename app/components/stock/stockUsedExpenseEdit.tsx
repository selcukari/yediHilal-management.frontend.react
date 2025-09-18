import { forwardRef, useEffect, useImperativeHandle, useState, Fragment, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, Title, Textarea, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';


interface StockUsedData {
  id: number;
  items: StockItem[];
}
interface StockDataParams {
  id: number;
  updateUserId?: number;
  buyerId: number;
  items?: string;
  type: string;
  isDelivery: boolean;
  title: string;
  address: string;
  note: string;
}

type FormValues = {
  isDelivery: boolean;
  title: string;
  address: string;
  note: string;
};

interface StockItem {
  name?: string;
  key?: string;
  count?: number;
}

export type StockUsedExpenseEditDialogControllerRef = {
  openDialog: (dialogTitle: string, value: StockUsedData, stockDataItems: StockItem[]) => void;
  close: () => void;
};
interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

const StockUsedExpenseEdit = forwardRef<StockUsedExpenseEditDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [stockDataFirtsItems, setStockDataFirstItems] = useState<StockItem[]>([]);
  const [dialogTitle, setDialogTitle] = useState("");
  
  const [stockData, setStockData] = useState<any>({ items: [], id: 0 });
  const [opened, { open, close }] = useDisclosure(false);
  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      isDelivery: false,
      title: '',
      address: '',
      note: '',
    },
    validate: {
      title: (value) => (value.trim().length < 5 ? 'Başlık en az 5 karakter olmalı' : null),
    },
  });

  useEffect(() => {
    if (form.isValid()) {
      setIsDisabledSubmit(false);

      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newItems = stockData.items.map((item: any) => ({key: item.key, count: item.count, name: item.name})) || "";

    // Stok kontrolü yap
    let hasStockExceeded = false;
    for (const item of stockDataFirtsItems) {
      const findItem = newItems.find((i: StockItem) => i.key == item.key);

    // Eğer bu key ikinci dizide varsa ve count değeri daha büyükse
      if (findItem && findItem.count as number > (item.count ?? 0)) {
        toast.info(`${item.name} adeti stock tan fazla olmaz!`);
        hasStockExceeded = true;
        break;
      }
    };

     // Eğer stok aşımı varsa işlemi durdur
    if (hasStockExceeded) {
      setIsDisabledSubmit(false);
      return;
    }

    const newStockValue: StockDataParams = {
      id: stockData.id,
      buyerId: currentUser?.id as number,
      items: JSON.stringify(newItems),
      isDelivery: values.isDelivery,
      type: stockData.type,
      title: values.title,
      address: values.address,
      note: values.note
    }

    const result = await service.updateStockUsedExpense(newStockValue);

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

  const openDialog = (dialogTitle: string, value: StockUsedData, stockDataItems: StockItem[]) => {

    if (value) {
      form.reset();
        let newStockDataItems = stockDataItems;

      const matchingItems = value.items.filter((valueItem: StockItem) => 
        stockDataItems.some((stockItem: StockItem) => stockItem.key === valueItem.key)
      );

      if (matchingItems.length > 0) {
          
        newStockDataItems = stockDataItems.map((stockItem: StockItem) => {
          const valueItem = value.items.find((vi: StockItem) => vi.key === stockItem.key);
          
          if (valueItem) {
              return {
                  ...stockItem,
                  count: ((stockItem.count ?? 0) + (valueItem.count ?? 0)) || 1,
              };
          }
          return stockItem;
        });
      }

      setStockData(value);
      setDialogTitle(dialogTitle);
      setStockDataFirstItems((newStockDataItems))
      open();

    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

    const handleItemChange = (key: string, newCount: number) => {
    if (!stockData) return;

    setStockData((prevData:any) => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        items: prevData.items.map((item: any) => 
          item.key === key 
            ? { ...item, count: newCount, value: newCount }
            : item
        )
      };
    });

    setIsDisabledSubmit(false);
  };

   const rowItems = () => {
      if (!stockData?.items) return null;
  
      return stockData.items.map((item: any, index: number) => (
        <Fragment key={`item-${index}`}>
          <Grid.Col span={2}>
            <Flex mih={50} gap="md" justify="center" align="center" direction="row" wrap="wrap">
              <Title order={4}>{item.name}:</Title>
            </Flex>
          </Grid.Col>
          <Grid.Col span={1.5}>
            <TextInput
              placeholder={`${item.name} giriniz`}
              value={item.count.toString()}
              onChange={(event) => {
                const value = parseInt(event.target.value) || 0;
                handleItemChange(item.key, value);
              }}
              type="number"
              min={0}
            />
          </Grid.Col>
        </Fragment>
      ));
    };

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title={dialogTitle}
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
                label="Etkinlik/Program Adı"
                placeholder="Başlık giriniz"
                required
                {...form.getInputProps('title')}
              />
             </Grid.Col>
             <Grid.Col span={6}>
              <TextInput
                label="Adres"
                placeholder="Adres giriniz"
                required
                {...form.getInputProps('address')}
              />
             </Grid.Col>
             <Grid.Col span={10} offset={1}>
              <Textarea
                mt="md"
                label="Note"
                placeholder="messaj..."
                withAsterisk
                {...form.getInputProps('note')}
              />
            </Grid.Col>
            {rowItems()}
          <Grid.Col span={6}>
            <Switch 
              label="Tamamlandı Durumu" 
              checked={form.values.isDelivery}
              onChange={(event) => form.setFieldValue('isDelivery', event.currentTarget.checked)}
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

export default StockUsedExpenseEdit;
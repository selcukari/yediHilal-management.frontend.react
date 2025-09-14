import { forwardRef, useEffect, useImperativeHandle, useState, Fragment, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, Title, Group, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { clone } from 'ramda';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';

interface StockItem {
  name: string;
  key: string;
  count: number;
  color: string;
  value?: number;
  tooltip?: string;
}

export type StockUsedAddDialogControllerRef = {
  openDialog: (dialogTitle: string, type: string, stockItems: StockItem[]) => void;
  close: () => void;
};

interface StockUsedAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

interface StockDataParams {
  buyerId: number;
  items?: string;
  type: string;
  isDelivery: boolean;
}

type FormValues = {
  isDelivery: boolean;
};

const StockUsedAdd = forwardRef<StockUsedAddDialogControllerRef, StockUsedAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(true);
  const [type, setType] = useState("expense");
  const [dialogTitle, setDialogTitle] = useState("");
  
  const [stockItem, setStockItem] = useState<StockItem[]>([]);
  const [stockItemInitial, setStockItemInitial] = useState<StockItem[]>([]);
  const [stockItemFirstInitial, setStockItemFirstInitial] = useState<StockItem[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      isDelivery: false,
    },
    validate: {
    
    },
  });

  useEffect(() => {
    setIsDisabledSubmit(!(stockItem.filter((item: any) => item.count > 0).length > 0));
  }, [stockItem]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newItems = stockItem.filter((item: any) => item.count > 0).map((item: any) => ({key: item.key, count: item.count, name: item.name})) || "";

    // Stok kontrolü yap
    let hasStockExceeded = false;

    for (const item of stockItemFirstInitial) {
      const findItem = newItems.find(i => i.key == item.key);
      
      // Eğer bu key ikinci dizide varsa ve count değeri daha büyükse
      if (findItem && findItem.count as number > item.count) {
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
      buyerId: currentUser?.id as number,
      items: JSON.stringify(newItems),
      isDelivery: values.isDelivery,
      type: type
    }

    const result = await service.addStockUsed(newStockValue);

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
     if (!isEquals(stockItem, stockItemInitial)) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }

  const openDialog = (dialogTitle:string, type: string, stockItem: StockItem[]) => {

    if (stockItem.length > 0) {
      form.reset();
      setStockItem(stockItem.map((item: any) => ({...item, count: 0})));
      setStockItemInitial(clone(stockItem.map((item: any) => ({...item, count: 0}))));
      setStockItemFirstInitial(clone(stockItem));
      setType(type);
      setDialogTitle(dialogTitle);
      open();

    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

    const handleItemChange = (key: string, newCount: number) => {
    if (stockItem.length < 0) return;

    setStockItem((prevData: StockItem[]) =>
      prevData.map((item: any) =>
        item.key === key
          ? { ...item, count: newCount, value: newCount }
          : item
      )
    );

    setIsDisabledSubmit(false);
  };

   const rowItems = () => {
      if (stockItem.length < 0) return null;
  
      return stockItem.map((item: any, index: number) => (
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

export default StockUsedAdd;
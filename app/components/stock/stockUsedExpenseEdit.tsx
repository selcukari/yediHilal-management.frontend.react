import { forwardRef, useEffect, useImperativeHandle, useState, Fragment, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Flex, Button, Stack, Grid, Title, Group, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';

export type StockUsedExpenseEditDialogControllerRef = {
  openDialog: (dialogTitle: string, value: any) => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

interface StockDataParams {
  id: number;
  updateUserId?: number;
  buyerId: number;
  items?: string;
  type: string;
  isDelivery: boolean;
}

type FormValues = {
  isDelivery: boolean;
};

const StockUsedExpenseEdit = forwardRef<StockUsedExpenseEditDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  
  const [stockData, setStockData] = useState<any>({ items: [], id: 0 });
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
    if (form.isValid()) {
        setIsDisabledSubmit(false);

        return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newStockValue: StockDataParams = {
      id: stockData.id,
      buyerId: currentUser?.id as number,
      items: JSON.stringify(stockData.items.map((item: any) => ({key: item.key, count: item.count, name: item.name})) || ""),
      isDelivery: values.isDelivery,
      type: stockData.type
    }

    const result = await service.updateStockUsedExpense(newStockValue);

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

  const openDialog = (dialogTitle: string, value: any) => {

    if (value) {
      form.reset();
      setStockData(value);
      setDialogTitle(dialogTitle);
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
            {rowItems()}
         
          <Grid.Col span={6}>
            <fieldset style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
              <legend style={{ padding: '0 8px', fontWeight: 600 }}>Durum Ayarları</legend>
                <Switch 
                  label="Tamamlandı Durumu" 
                  checked={form.values.isDelivery}
                  onChange={(event) => form.setFieldValue('isDelivery', event.currentTarget.checked)}
                />
            </fieldset>
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
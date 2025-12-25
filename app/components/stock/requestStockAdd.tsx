import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Text, Checkbox, Group, Badge, ActionIcon, Textarea, Paper, Table, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useStockService } from '../../services/stockService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';

interface StockData {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  shelveId: number;
  shelveName: string;
  warehouseId: number;
  warehouseName: string;
  createDate: string;
  name: string;
  updateDate: string;
  expirationDate?: string;
  nameKey: string;
  place: string;
  isActive: boolean;
  unitPrice: number;
  totalPrice?: number;
  count?: number;
  note?: string;
  requestCount?: number; // Talep edilen sayı
  description?: string; // Talep notu
  fromWhere?: string;
  checked?: boolean;
  actions?: string;
}

interface Column {
  field: keyof StockData;
  header: string;
}

export type RequestStockAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface RequestStockAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

// Her bir ürün için talep formu değerleri
interface RequestItem {
  stockId: number;
  requestCount: number;
  description: string;
  note: string;
}

type FormValues = {
  updateUserId: number;
  items: RequestItem[];
};

const RequestStockAdd = forwardRef<RequestStockAddDialogControllerRef, RequestStockAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const serviceStock = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      updateUserId: currentUser?.id || 0,
      items: [], // Başlangıçta boş talep listesi
    },
    validate: {
      // items: {
      //   requestCount: (value) => (value <= 0 ? 'Talep edilen sayı 0\'dan büyük olmalı' : null),
      // },
    },
  });

  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'name', header: 'Ürün Adı' },
    { field: 'requestCount', header: 'Taleb Edilen Sayı' },
    { field: 'description', header: 'Not' },
    { field: 'actions', header: 'Seçim' },
  ]);

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
      return;
    }
    setIsDisabledSubmit(true);
  }, [form.values]);

  useEffect(() => {
    if (opened) {
      fetchStock();
    }
  }, [opened]);

  const fetchStock = async () => {
    try {
      const getStocks = await serviceStock.getStocks();
      if (getStocks) {
        setStockData(getStocks);
        // Başlangıçta tüm ürünler için boş talep öğeleri oluştur
        const initialItems = getStocks.map((stock: any) => ({
          stockId: stock.id,
          requestCount: 0,
          description: '',
          note: ''
        }));
        form.setFieldValue('items', initialItems);
      } else {
        console.error('No setStockData data found');
      }
    } catch (error: any) {
      toast.error('Stok verileri yüklenirken hata oluştu');
    }
  };

  // Tekil talep öğesini güncelle
  const updateRequestItem = (stockId: number, field: keyof RequestItem, value: any) => {
    const currentItems = [...form.values.items];
    const itemIndex = currentItems.findIndex(item => item.stockId === stockId);
    
    if (itemIndex !== -1) {
      currentItems[itemIndex] = { ...currentItems[itemIndex], [field]: value };
      form.setFieldValue('items', currentItems);
    }
  };

  // Seçili ürünleri güncelle
  const toggleItemSelection = (stockId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(stockId)) {
      newSelected.delete(stockId);
      // Seçimi kaldırılırsa talep alanlarını sıfırla
      updateRequestItem(stockId, 'requestCount', 0);
      updateRequestItem(stockId, 'description', '');
    } else {
      newSelected.add(stockId);
    }
    setSelectedItems(newSelected);
  };

  const handleSubmit = async (values: FormValues) => {
    // Sadece seçili ve talep sayısı > 0 olan ürünleri filtrele
    const validRequests = values.items.filter(item => 
      selectedItems.has(item.stockId) && item.requestCount > 0
    );

    if (validRequests.length === 0) {
      toast.warning('Lütfen en az bir ürün seçin ve talep sayısı girin');
      return;
    }

    setIsDisabledSubmit(true);

    try {
      // Talep verilerini hazırla
      const requestData = {
        requestStocks: validRequests.map(item => ({
          updateUserId: currentUser?.id as number,
          productId: item.stockId,
          count: item.requestCount,
          description: item.description, // taleb edenin notu
          note: item.note // ek not
        }))
      };

      // Burada API çağrısını yapmanız gerekiyor
      const result = await serviceStock.createStockRequest(requestData);

      if (result == true) {
        toast.success('Talep başarıyla oluşturuldu!');
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        close();
        form.reset();
        setSelectedItems(new Set());
      }
      if (result?.data === false && result?.errors?.length > 0) {
        toast.warning(result.errors[0]);
      }
    } catch (error: any) {
      console.error('Talep gönderimi hatası:', error);
      toast.error(error.message || 'Bir hata oluştu!');
    } finally {
      setIsDisabledSubmit(false);
    }
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
    setSelectedItems(new Set());
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const rowsTable = stockData.map((item) => {
    const itemIndex = form.values.items.findIndex(i => i.stockId === item.id);
    const requestItem = itemIndex !== -1 ? form.values.items[itemIndex] : null;
    const isSelected = selectedItems.has(item.id);

    return (
      <Table.Tr key={item.id} bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
        {rowHeaders.map((header) => {
          if (header.field === 'count') {
            return (
              <Table.Td key={header.field}>
                <Badge color={(item[header.field] || 0) > 50 ? 'green' : 'red'}>
                  {item[header.field] || 0}
                </Badge>
              </Table.Td>
            );
          }
          
          if (header.field === 'requestCount') {
            return (
              <Table.Td key={header.field}>
                <TextInput
                  placeholder="Adet giriniz"
                  type="number"
                  min={1} required
                  // max={item.count || 0}
                  onChange={(e) => updateRequestItem(item.id, 'requestCount', parseInt(e.target.value) || 0)}
                  disabled={!isSelected}
                />
              </Table.Td>
            );
          }
          
          if (header.field === 'description') {
            return (
              <Table.Td key={header.field}>
                <TextInput
                  placeholder="Not giriniz"
                  value={requestItem?.description || ''}
                  onChange={(e) => updateRequestItem(item.id, 'description', e.target.value)}
                  disabled={!isSelected}
                />
              </Table.Td>
            );
          }
          
          if (header.field === 'actions') {
            return (
              <Table.Td key={header.field}>
                <Group gap="xs" justify="center">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleItemSelection(item.id)}
                  />
                </Group>
              </Table.Td>
            );
          }
          
          return (
            <Table.Td key={header.field}>
              {item[header.field] || '-'}
            </Table.Td>
          );
        })}
      </Table.Tr>
    );
  });

  const dialogClose = () => {
    if (!isEquals(form.getInitialValues(), form.getValues())) {
      confirmModalRef.current?.open();
    } else {
      close();
      form.reset();
      setSelectedItems(new Set());
    }
  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (
    <>
      <Modal
        opened={opened}
        onClose={dialogClose}
        title="Yeni Ürün Talebi"
        centered
        size="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              {/* Ürün Tablosu */}
              <Grid.Col span={12}>
                <Paper shadow="xs" p="lg" withBorder>
                  <Stack gap="md">
                    <Title order={4}>Ürünler ({stockData.length})</Title>
                    <Table.ScrollContainer minWidth={800} maxHeight={500}>
                      <Table striped highlightOnHover withColumnBorders>
                        <Table.Thead>
                          <Table.Tr>
                            {rowHeaders.map((header) => (
                              <Table.Th key={header.field} ta="center">
                                {header.header}
                              </Table.Th>
                            ))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rowsTable}</Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                    <TextInput
                      placeholder="Açıklama giriniz"
                      onChange={(e) => updateRequestItem(stockData[0]?.id, 'note', e.target.value)}
                    />
                    <Text size="sm" c='red'>
                      * Sadece seçili ürünler için talep oluşturulacaktır
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              
              {/* Butonlar */}
              <Grid.Col span={12}>
                <Group justify="flex-end" gap="md">
                  <Button 
                    variant="filled" 
                    color="red" 
                    leftSection={<IconCancel size={14} />}
                    onClick={dialogClose}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    variant="filled" 
                    disabled={isDisabledSubmit || selectedItems.size === 0}
                    leftSection={<IconCheck size={14} />}
                    loading={isDisabledSubmit}
                  >
                    Talebi Gönder ({selectedItems.size} ürün)
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </Stack>
        </form>
      </Modal>
      
      {/* Confirm Dialog */}
      <ConfirmModal 
        ref={confirmModalRef}
        onConfirm={confirmDialogHandleConfirm}
        onCancel={confirmDialogHandleCancel}
      />
    </>
  );
});

export default RequestStockAdd;
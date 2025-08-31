import { useState, useEffect, Fragment, useRef } from 'react';
import {
  Container, Grid, TextInput, Text, Stack, Group, Title, RingProgress,
  Paper, Button, LoadingOverlay, Flex,
} from '@mantine/core';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useStockService } from '../services/stockService';
import { toast } from '../utils/toastMessages';
import ItemAdd, { type ItemAddDialogControllerRef } from '../components/stock/itemAdd';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '~/authContext';

interface StockItem {
  name: string;
  key: string;
  count: number;
  color: string;
  value?: number;
  tooltip?: string;
}

interface StockData {
  id: number;
  updateUserId: number;
  updateUserFullName: string;
  createDate: string;
  items: StockItem[];
}

export default function Stock() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [visible, { open, close }] = useDisclosure(false);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(true);
  const { currentUser } = useAuth();

  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const itemAddRef = useRef<ItemAddDialogControllerRef>(null);

  useEffect(() => {
    setTimeout(() => {
        fetchStock();
      }, 1000);
  }, []);

  const fetchStock = async () => {
    open();
    try {
      const getStock = await service.getStock();
      
      if (getStock) {
        const parsedItems: StockItem[] = JSON.parse(getStock.items) || [];
        const newStockData: StockData = {
          id: getStock.id,
          updateUserId: getStock.updateUserId,
          updateUserFullName: getStock.updateUserFullName,
          createDate: formatDate(getStock.createDate),
          items: parsedItems.map(item => ({
            ...item,
            value: item.count,
            tooltip: item.name
          })),
        };
        
        setStockData(newStockData);
      } else {
        toast.info('Hiçbir veri yok!');
        setStockData(null);
      }
    } catch (error: any) {
      toast.error(`Stok yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (typeof stockData?.id !== 'number') {
        toast.error('Stok ID bulunamadı!');
        return;
      }
      const newValue = {
        id: stockData.id,
        updateUserId: currentUser?.id as number,
        items: JSON.stringify(stockData?.items)
      };
        const result = await service.updateStock(newValue);

      if (result) {
        toast.success('Stok başarıyla güncellendi!');
        fetchStock();

      } else {
        toast.error('Bir hata oluştu!');
    }
    } catch (error: any) {
      toast.error(`Stok güncellenirken hata: ${error.message}`);
    }
  };

  const handleSaveSuccess = () => {
    setTimeout(() => {
      fetchStock();
    }, 1500);
  };

  const handleItemChange = (key: string, newCount: number) => {
    if (!stockData) return;

    setStockData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        items: prevData.items.map(item => 
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

    return stockData.items.map((item, index) => (
      <Fragment key={`item-${index}`}>
        <Grid.Col span={1.5}>
          <Flex mih={50} gap="md" justify="center" align="center" direction="row" wrap="wrap">
            <Title order={4}>{item.name}:</Title>
          </Flex>
        </Grid.Col>
        <Grid.Col span={1}>
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

  const calculateTotal = () => {
    if (!stockData?.items) return 0;
    return stockData.items.reduce((total, item) => total + item.count, 0);
  };

  const handleAddItem = (data: any) => {
    itemAddRef.current?.openDialog({
        id: data.id,
        items: data.items
    })
  }

  return (
    <Container size="xl">
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Stack gap="lg">
        {/* Sayfa Başlığı */}
          <Flex mih={50} gap="md" justify="center" align="center" direction="row" wrap="wrap">
            <RingProgress
              size={170}
              thickness={16}
              label={
                <Text size="xs" ta="center" px="xs" style={{ pointerEvents: 'none' }}>
                  Genel Toplam: {calculateTotal()}
                </Text>
              }
              sections={(stockData?.items || []).map(item => ({
                value: (item.count / Math.max(calculateTotal(), 1)) * 100,
                color: item.color,
                tooltip: `${item.name}: ${item.count}`
              }))}
            />
          </Flex>
            <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
            <Button variant="filled" leftSection={<IconPlus size={14} />}  onClick={() => handleAddItem(stockData)}>Yeni Ekle</Button>
          </Flex>
        {/* Stok Formu */}
        <Paper shadow="xs" p="lg" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Title order={4}>Stok Yönetimi</Title>
              <Grid columns={10} justify="center">
                {rowItems()}
                <Grid.Col span={6} offset={4}>
                  <Button 
                    type="submit" 
                    variant="filled" 
                    size="xs" 
                    disabled={isDisabledSubmit}  
                    leftSection={<IconCheck size={14} />} 
                    radius="xs"
                  >
                    Kaydet
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          </form>
        </Paper>
      </Stack>
        <ItemAdd ref={itemAddRef} onSaveSuccess={handleSaveSuccess} />
    </Container>
  );
}
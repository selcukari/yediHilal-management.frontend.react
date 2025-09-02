import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Badge, Stack, Group, Title, Text, Paper,
  ActionIcon, Table, LoadingOverlay, Flex, Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useStockService } from '../services/stockService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { useAuth } from '~/authContext';
import StockUsedExpenseEdit, { type StockUsedExpenseEditDialogControllerRef } from '../components/stock/stockUsedExpenseEdit';
import StockUsedAdd, { type StockUsedAddDialogControllerRef } from '../components/stock/stockUsedAdd';
interface Column {
  field: string;
  header: string;
}
interface StockItem {
  name: string;
  key: string;
  count: number;
  color: string;
  value?: number;
  tooltip?: string;
}

export default function StockUsedDeposit() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [stockDataItems, setStockDataItems] = useState<StockItem[] | null>([]);
  const [visible, { open, close }] = useDisclosure(false);
  const stockUsedExpenseEditRef = useRef<StockUsedExpenseEditDialogControllerRef>(null);
  const stockUsedAddRef = useRef<StockUsedAddDialogControllerRef>(null);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'items', header: 'Giderler' },
    { field: 'buyerInformations', header: 'Alıcı Bilgileri' },
    { field: 'isDelivery', header: 'Bitiş Durum' },
    { field: 'createDate', header: 'Kayıt Tarih' },
    { field: 'updateDate', header: 'Güncelleme Tarih' },
    { field: 'actions', header: 'İşlemler' },
  ]);

  const service = useStockService(import.meta.env.VITE_APP_API_STOCK_CONTROLLER);
  const { currentUser } = useAuth();
  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;

    
    return resultData.filter(stock => stock.buyerInformations?.fullName?.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchStockUsedExpense();
    }, 1000);
  }, []);

  const handleSaveSuccess = () => {

    setTimeout(() => {
      fetchStockUsedExpense();
    }, 1000);
  };

    const renderBoolean = (value: boolean) => {
      return (
        <Badge color={!value ? 'green' : 'red'}>
          {!value ? 'Aktive' : 'Bitti'}
        </Badge>
      );
    };

    const handleDelete = async (id: number) => {

      const result = await service.deleteStockUsed(id);
      if (result === true) {

        toast.success('İşlem başarılı!');

        fetchStockUsedExpense();
      
      return;
    }
    if (result?.data === false && result?.errors) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }

    }
    const handleEdit = (item: any) => {
      stockUsedExpenseEditRef.current?.openDialog("Gider Düzenle", item, stockDataItems || []);
    }
    const handleAddItem = () => {
      stockUsedAddRef.current?.openDialog("Emanet Ekle","deposit", stockDataItems || [])
    }

  const rowsTable = filteredUsers.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
        if (header.field === 'actions') {
          return (
            <Table.Td key={header.field}>
              <Group gap="xs">
                <ActionIcon 
                  variant="light" 
                  color="blue"
                  disabled={item.isDelivery as boolean}
                  onClick={() => handleEdit(item)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" 
                  color="red"
                  disabled={item.isDelivery as boolean}
                  onClick={() => handleDelete(item.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          );
        }
        if (header.field === 'buyerInformations') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field]["fullName"]}(${item[header.field]["phone"]})` : "-"}
            </Table.Td>
          );
        }
        if (header.field === 'isDelivery') {
            return (
              <Table.Td key={header.field}>
                {renderBoolean(item[header.field])}
              </Table.Td>
            );
          }
        if (header.field === 'items') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${item[header.field].map((item: any) => `${item.name}(${item.count})`).join(',').substring(0,25)}` : '-'}
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
  ));

  const fetchStockUsedExpense = async () => {
     open();

    const type = "deposit";
    const buyerId = (
        ((currentUser?.responsibilities as string)?.includes("stock") || currentUser.roleId == 1) ? undefined : currentUser?.id as number
      )
     try {
      const getStock = await service.getStock();

      const getStockUsedExpenses = await service.getStockUsed(type, buyerId);
      if (getStockUsedExpenses && getStock) {
        setResultData(getStockUsedExpenses.map((stockUsed: any) => ({
          id: stockUsed.id,
          buyerInformations: stockUsed.buyerInformations ? JSON.parse(stockUsed.buyerInformations) : null,
          items: stockUsed.items ? JSON.parse(stockUsed.items) : null,
          type: stockUsed.type,
          isDelivery: stockUsed.isDelivery, // true ise edit yapma
          isActive: stockUsed.isActive,
          createDate: formatDate(stockUsed.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          updateDate: formatDate(stockUsed.updateDate, dateFormatStrings.dateTimeFormatWithoutSecond),
        })));
        const parsedItems: StockItem[] = JSON.parse(getStock.items) || [];
        setStockDataItems(parsedItems.map(item => ({
          ...item,
          value: item.count,
        })))
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
        toast.error(`getStockUsedExpenses yüklenirken hata: ${error.message}`);
      close();
    }
  };

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
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Stock Emanet Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
          </Group>

          {/* İçerik Kartları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>

                <Grid.Col span={4}>
                  <TextInput
                    label="Emanetci İsim Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                
                <Grid.Col span={4}>
                <Flex mih={50} gap="md" justify="flex-end" align="flex-end" direction="row" wrap="wrap">
                  <Button variant="filled" leftSection={<IconPlus size={14} />}  onClick={handleAddItem}>Yeni Emanet Ekle</Button>
                </Flex>
                </Grid.Col>

              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Stock Emanetler({rowsTable?.length || 0})</Title>
              <Table.ScrollContainer minWidth={400} maxHeight={700}>
                <Table striped highlightOnHover withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      {rowHeaders.map((header) => (
                        <Table.Th key={header.field}>{header.header}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rowsTable}</Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>
        </Stack>
        <StockUsedExpenseEdit
          ref={stockUsedExpenseEditRef} onSaveSuccess={handleSaveSuccess}
        ></StockUsedExpenseEdit>
        <StockUsedAdd
          ref={stockUsedAddRef} onSaveSuccess={handleSaveSuccess}
        ></StockUsedAdd>
      </Container>
  );
}
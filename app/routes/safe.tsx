import { useState, useEffect, useMemo } from 'react';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Stack, Button, Flex, Group, Title, Text, Paper, Table, LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTransactionSafeService } from '../services/transactionSafeService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import {  PaymentType, PaymentTypeStatus } from '../components'
import { dateFormatStrings } from '../utils/dateFormatStrings';
import { useAuth } from '~/authContext';

interface Column {
  field: string;
  header: string;
}

export default function Mail() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [paymentTypeIds, setPaymentTypeIds] = useState<string[] | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentTypesData, setPaymentTypesData] = useState<any[]>([]);
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'sender', header: 'Gönderen' },
    { field: 'receiver', header: 'Alıcı' },
    { field: 'amount', header: 'Miktar' },
    { field: 'transactionType', header: 'İşlem Türü' },
    { field: 'status', header: 'Durum' },
    { field: 'transactionDate', header: 'İşlem Tarihi' },
    { field: 'receiverAccount', header: 'Alıcı Hesabı' },
    { field: 'transactionReference', header: 'işlem Referansı' },
    { field: 'paymentType', header: 'Ödeme Türü' },
    { field: 'description', header: 'Açıklama' },
    { field: 'processedAt', header: 'işlenme tarihi' },
    { field: 'createDate', header: 'Kayıt Tarihi' },
  ]);

  const { isLoggedIn } = useAuth();

  const service = useTransactionSafeService(import.meta.env.VITE_APP_API_SAFE_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(safe =>
      safe.sender.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      safe.description.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [resultData, searchText]);

  useEffect(() => {
    if (isLoggedIn) {
      setTimeout(() => {
        fetchTransactionSafe();
      }, 1000);
    }
  }, []);

  const onPaymentTypeChange = (paymentTypeValues: string[] | null): void => {
    setPaymentTypeIds(paymentTypeValues)
  };

  const onPaymentTypeStatusChange = (statusValues: string | null): void => {
    setPaymentStatus(statusValues)
  };

  const rowsTable = filteredUsers.map((item) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
       if (header.field === 'paymentType') {
          return (
            <Table.Td key={header.field}>
              {item[header.field] ? `${paymentTypesData.find(i => i.id == item[header.field]).name}`: "-"}
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

  const fetchTransactionSafe = async () => {
     open();

     try {
      const filterModel = {
        paymentTypeIds: (paymentTypeIds && paymentTypeIds?.length > 0) ? paymentTypeIds?.join(",") : undefined,
        status: paymentStatus || undefined
      };

      const getSafe = await service.getSafe(filterModel);
      if (getSafe) {
        setResultData(getSafe.map((safe: any) => ({
          id: safe.id,
          sender: safe.sender,
          receiver: safe.receiver,
          amount: safe.amount,
          transactionType: safe.transactionType,
          status: safe.status,
          transactionDate: formatDate(safe.transactionDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          receiverAccount: safe.receiverAccount,
          transactionReference: safe.transactionReference,
          paymentType: safe.paymentType,
          description: safe.description,
          processedAt: formatDate(safe.processedAt, dateFormatStrings.dateTimeFormatWithoutSecond),
          createDate: formatDate(safe.createDate, dateFormatStrings.dateTimeFormatWithoutSecond),
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
      toast.error(`Mail yüklenirken hata: ${error.message}`);
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
              <Title order={2}>Kasa Sayfası</Title>
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
                    label="Alıcı veya Açıklama Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <PaymentType
                    onPaymentTypeChange={onPaymentTypeChange}
                    paymentTypesData={(value) => setPaymentTypesData(value)}
                  ></PaymentType>
                </Grid.Col>
                <Grid.Col span={3}>
                  <PaymentTypeStatus
                    onPaymentTypeStatusChange={onPaymentTypeStatusChange}
                  ></PaymentTypeStatus>
                </Grid.Col>
                <Grid.Col span={2}>
                  <Flex
                    mih={50}
                    gap="md"
                    justify="flex-end"
                    align="flex-end"
                    direction="row"
                    wrap="wrap"
                  >
                    <Button
                      leftSection={<IconFilter size={14} />}
                      onClick={fetchTransactionSafe}>
                      Filtrele
                    </Button>
                  </Flex>
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son İşlemler({rowsTable?.length || 0})</Title>
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
      </Container>
  );
}
import { useState, useEffect } from 'react';
import { 
  Modal, Table, Group, Button, Text, Badge, ScrollArea, 
  Select, NumberInput, Stack , LoadingOverlay
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useAuthStore } from '~/authContext';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconReceipt, IconCheck, IconCancel } from '@tabler/icons-react';
import { useMemberService } from '../../services/memberService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toastMessages';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useTransactionFinanceService } from '../../services/transactionFinanceService';

export interface FinanceModalProps {
  opened: boolean;
  onClose: () => void;
  memberId?: number;
  memberFullName?: string;
}

export interface FinanceRecord {
  id: string;
  paymentType: string;
  amount: string;
  transactionDate: string;
  status: string; // 'Ödendi' | 'Bekliyor'
  sender: string; // gonderici
  receiver: string; //alici
  userId: number; // üye id
}

interface PaymentFormValues {
  paymentType: string;
  amount: string | '';
  transactionDate: Date | null;
  status: string;
}

export const FinanceModal = ({ opened, onClose, memberId, memberFullName }: FinanceModalProps) => {
  // Ödeme Ekle Modal Kontrolü
  const [addPaymentOpened, { open: openAddPayment, close: closeAddPayment }] = useDisclosure(false);
  const { currentUser } = useAuthStore();
  const service = useMemberService(import.meta.env.VITE_APP_API_FINANCE_CONTROLLER);
  const servicePaymentStatus = useTransactionFinanceService(import.meta.env.VITE_APP_API_FINANCE_CONTROLLER);
  
  // Yeni Ödeme Formu
  const paymentForm = useForm<PaymentFormValues>({
    initialValues: {
      paymentType: '',
      amount: '',
      transactionDate: new Date(),
      status: 'Ödendi',
    },
    validate: {
      paymentType: (value) => (!value ? 'İşlem tipi seçiniz' : null),
      amount: (value) => (!value ? 'Geçerli bir tutar giriniz' : null),
      transactionDate: (value) => (!value ? 'Tarih seçiniz' : null),
      status: (value) => (!value ? 'Durum seçiniz' : null),
    },
  });

  useEffect(() => {
    if (opened && memberId) {
      refetch(); // Modal açıldığında verileri yeniden çek
    }
 }, [opened]);

  const { data: paymentTypes = [] } = useQuery({
    queryKey: ["paymentTypes"],
    queryFn: async () => {
      const response = await servicePaymentStatus.getPaymentTypes();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

    const { data: resultData = [], isLoading: isQueryLoading, refetch } = useQuery({
        queryKey: ['finansByUserId', memberId],
        enabled: !!memberId, // memberId boşsa API çağrısı yapmaz
        queryFn: async () => {
            if (!memberId) {
                toast.error('Üye ID bulunamadı!');
                return [];
            }

            const getFinansByUserId = await service.finansByUserId(memberId);
            if (getFinansByUserId) {
                const getStatusText = (status: string) => {
                    if (status === 'completed') return 'Ödendi';
                    if (status === 'pending') return 'Bekliyor';
                    return 'Hata';
                };

                return getFinansByUserId.map((finans: any) => ({
                    id: finans.id,
                    amount: finans.amount.toString(),
                    paymentType: finans.paymentType.name,
                    status: getStatusText(finans.status),
                    transactionDate: formatDate(finans.transactionDate, dateFormatStrings.dateTimeFormatWithoutSecond),
                }));
            }
            toast.info('Hiçbir veri yok!');
            return [];
        },
        staleTime: 1000 * 60 * 60 * 24, // Veriyi 1 gün güncel kabul et, gereksiz API isteklerini önle
    });

  // Yeni Ödeme Kaydetme Fonksiyonu
  const handleAddPaymentSubmit = async (values: PaymentFormValues) => {
    const formattedDate = values.transactionDate 
      ? values.transactionDate.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];

    const newRecord: FinanceRecord = {
      id: Date.now().toString(),
      paymentType: values.paymentType as 'Aidat' | 'Bağış' | 'Diğer',
      amount: values.amount.toString(),
      transactionDate: formattedDate,
      status: values.status,
      sender: currentUser?.fullName || 'Bilinmiyor',
      receiver: memberFullName || 'Bilinmiyor',
      userId: memberId || 0,
    };

    try {
      await servicePaymentStatus.addFinance(newRecord);
    } catch (error) {
      toast.error('Ödeme eklenirken bir hata oluştu!');
    }

    paymentForm.reset();
    closeAddPayment();

    refetch(); // Yeni ödeme eklendikten sonra verileri yeniden çek
  };

  const mockDataPaymentTypeStatus =[
    {value: "failed", label: "Hata"},
    {value: "pending", label: "Bekliyor"},
    {value: "completed", label: "Ödendi"}
  ];

  const rows = resultData?.map((item: FinanceRecord) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.paymentType}</Table.Td>
      <Table.Td>{item.amount} ₺</Table.Td>
      <Table.Td>{item.transactionDate}</Table.Td>
      <Table.Td>
        <Badge color={item.status === 'Ödendi' ? 'green' : item.status === 'Bekliyor' ? 'yellow' : 'red'}>
          {item.status}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      {/* Ana Finans Modal */}
      <LoadingOverlay
        visible={isQueryLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
        />
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconReceipt size={20} />
            <Text fw={600}>Finansal Hareketler</Text>
          </Group>
        }
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <ScrollArea h={300}>
          <Table highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>İşlem Tipi</Table.Th>
                <Table.Th>Tutar</Table.Th>
                <Table.Th>Tarih</Table.Th>
                <Table.Th>Durum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" mt="md">
                      Kayıtlı finans hareketi bulunamadı.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="flex-end" mt="md">
          <Button 
            size="xs" 
            leftSection={<IconPlus size={14} />} 
            color="blue"
            onClick={openAddPayment}
          >
            Yeni Ödeme Ekle
          </Button>
          <Button size="xs" variant="outline" color="gray" onClick={onClose}>
            Kapat
          </Button>
        </Group>
      </Modal>

      {/* Yeni Ödeme Ekle Modal */}
      <Modal
        opened={addPaymentOpened}
        onClose={() => {
          paymentForm.reset();
          closeAddPayment();
        }}
        title={
          <Group gap="xs">
            <IconPlus size={18} />
            <Text fw={600}>Yeni Ödeme Ekle</Text>
          </Group>
        }
        size="sm"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={paymentForm.onSubmit(handleAddPaymentSubmit)}>
          <Stack gap="sm">
            <Select
              label="İşlem Tipi"
              placeholder="Tip seçiniz"
              data={paymentTypes}
              required
              {...paymentForm.getInputProps('paymentType')}
            />

            <NumberInput
              label="Tutar (₺)"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              suffix=" ₺"
              required
              {...paymentForm.getInputProps('amount')}
            />

            <DateInput
              label="İşlem Tarihi"
              placeholder="Tarih seçiniz"
              valueFormat="YYYY-MM-DD"
              required
              {...paymentForm.getInputProps('transactionDate')}
            />

            <Select
              label="Ödeme Durumu"
              placeholder="Durum seçiniz"
              data={mockDataPaymentTypeStatus}
              required
              {...paymentForm.getInputProps('status')}
            />

            <Group justify="flex-end" mt="md">
              <Button 
                variant="outline" 
                color="gray" 
                size="xs" 
                leftSection={<IconCancel size={14} />}
                onClick={() => {
                  paymentForm.reset();
                  closeAddPayment();
                }}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                color="green" 
                size="xs" 
                leftSection={<IconCheck size={14} />}
              >
                Kaydet
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default FinanceModal;
import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import { toast } from '../../utils/toastMessages';
import { useTransactionFinanceService } from '../../services/transactionFinanceService';

interface PaymentTypeProps {
  onPaymentTypeChange: (vals: string[] | null) => void;
  paymentTypesData: (vals: any[]) => void;
}

export function PaymentType({ onPaymentTypeChange, paymentTypesData }: PaymentTypeProps) {
  const [paymentType, setPaymentType] = useState<string[] | undefined>(undefined);
  const [paymentTypes, setPaymentTypes] = useState<{ value: string; label: string }[]>([]);
  
  const service = useTransactionFinanceService(import.meta.env.VITE_APP_API_FINANCE_CONTROLLER);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const response = await service.getPaymentTypes();

      if (response) {
        setPaymentTypes(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );

        paymentTypesData(response);
      } else {
        toast.info('Hiçbir veri yok!');
      }
    } catch (error: any) {
      toast.error(`paymentTypes yüklenirken hata: ${error.message}`);
    }
  };

  const handleChange = (values: string[]) => {
    
    onPaymentTypeChange(values); 
    setPaymentType(values);
  };

  return (
    <MultiSelect
      label="Ödeme Tipi"
      placeholder="Ödeme Tipi Seçiniz"
      data={paymentTypes}
      value={paymentType}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="Ödeme tipi bulunamadı..."
      onChange={handleChange}
    />
  );
}
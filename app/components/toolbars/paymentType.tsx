import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '../../utils/toastMessages';
import { useTransactionFinanceService } from '../../services/transactionFinanceService';

interface PaymentTypeProps {
  onPaymentTypeChange: (vals: string[] | null) => void;
}

export function PaymentType({ onPaymentTypeChange }: PaymentTypeProps) {
  const [paymentType, setPaymentType] = useState<string[] | undefined>(undefined);
  
  const service = useTransactionFinanceService(import.meta.env.VITE_APP_API_FINANCE_CONTROLLER);

  const { data: paymentTypes = [] } = useQuery({
    queryKey: ["paymentTypes"],
    queryFn: async () => {
      const response = await service.getPaymentTypes();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

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
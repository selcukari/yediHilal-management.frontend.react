import { Select } from '@mantine/core';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
interface PaymentTypeStatusProps {
  onPaymentTypeStatusChange: (val: string | null) => void;
}

export function PaymentTypeStatus({ onPaymentTypeStatusChange }: PaymentTypeStatusProps) {
  const [paymentTypeStatu, setPaymentTypeStatu] = useState<string | null>("");
  
  const mockDataPaymentTypeStatus =[
    {id: "pending", name: "Bekliyor"},
    {id: "completed", name: "Tamamlandı"}
  ];

  const { data: paymentTypeStatus = [] } = useQuery({
    queryKey: ["paymentTypeStatus"],
    queryFn: () => {

      return (mockDataPaymentTypeStatus ?? []).map((c: any) => ({
        value: c.id,
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  const handleChange = (value: string | null) => {
    onPaymentTypeStatusChange(value);
    setPaymentTypeStatu(value);
  };

  return (
    <Select
      label="Ödeme Durumu"
      placeholder="Durumu Seçiniz"
      data={paymentTypeStatus}
      value={paymentTypeStatu}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="Durum bulunamadı..."
      onChange={handleChange}
    />
  );
}
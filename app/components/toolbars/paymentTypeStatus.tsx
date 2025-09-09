import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { toast } from '../../utils/toastMessages';

interface PaymentTypeStatusProps {
  onPaymentTypeStatusChange: (val: string | null) => void;
}

export function PaymentTypeStatus({ onPaymentTypeStatusChange }: PaymentTypeStatusProps) {
  const [paymentTypeStatu, setPaymentTypeStatu] = useState<string | null>("");
  const [paymentTypeStatus, setPaymentTypeStatus] = useState<{ value: string; label: string }[]>([]);
  

  useEffect(() => {
    fetchPaymentTypeStatusData();
  }, []);

  const mockDataPaymentTypeStatus =[
    {id: "pending", name: "Bekliyor"},
    {id: "completed", name: "Tamamlandı"}
  ];

  const fetchPaymentTypeStatusData = async () => {
    try {

     setPaymentTypeStatus(
          mockDataPaymentTypeStatus.map((c: any) => ({
            value: c.id,
            label: c.name,
          }))
        );
    } catch (error: any) {
      toast.error(`PaymentTypeStatus yüklenirken hata: ${error.message}`);
      
    }
  };

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
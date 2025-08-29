import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { responsiblesMockData } from '~/utils/responsibles';

interface ResponsibleSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
}

export function ResponsibleSelect({ form, required = false, }: ResponsibleSelectProps) {
  const [responsibles, setResponsibles] = useState<{ value: string; label: string }[]>([]);
  
  useEffect(() => {
    fetchresponsiblesData();
  }, []);

  const fetchresponsiblesData = () => {
      
    setResponsibles(
      responsiblesMockData.map((c: any) => ({
        value: c.key,
        label: c.label,
      }))
    );
     
  };

  // Form değerini string'ten array'e çevir
  const selectedValues = form.values.responsibilities 
    ? form.values.responsibilities.split(',').filter(Boolean)
    : [];

  // Değer değiştiğinde array'i string'e çevirip form'a set et
  const handleChange = (values: string[]) => {
    form.setFieldValue('responsibilities', values.join(','));
  };

  return (
    <MultiSelect
      label="Sorumlu Modül"
      placeholder="Sorumlu Modül Seçiniz"
      data={responsibles}
      searchable
      clearable
      value={selectedValues}
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="Sorumlu Modül bulunamadı..."
      onChange={handleChange}
    />
  );
}
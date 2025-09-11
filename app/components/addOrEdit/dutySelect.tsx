import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useDutyService } from '../../services/dutyService';

interface DutySelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}
// gorevi
export function DutySelect({ form, required = false, isDisabled = false }: DutySelectProps) {
  const [duties, setDuties] = useState<{ value: string; label: string }[]>([]);
  const service =  useDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  useEffect(() => {
    fetchDutyData();
  }, []);

  const fetchDutyData = async () => {
    try {
      const response = await service.getDuties();

      if (response) {
        setDuties(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No getDuties data found');
      }
    } catch (error: any) {
      console.error('Error fetching getDuties:', error.message);
    }
  };

  // Form değerini string'ten array'e çevir
  const selectedValues = form.values.responsibilities 
    ? form.values.responsibilities.split(',').filter(Boolean)
    : [];

  // Değer değiştiğinde array'i string'e çevirip form'a set et
  const handleChange = (values: string[]) => {
    form.setFieldValue('duties', values.join(','));
  };

  return (
    <MultiSelect
      label="Görevi"
      placeholder="Görevi Seçiniz"
      data={duties}
      searchable
      clearable
      disabled={isDisabled}
      value={selectedValues}
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="Görevi bulunamadı..."
      onChange={handleChange}
    />
  );
}
import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useUserDutyService } from '../../services/userDutyService'; 

interface DutySelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}
// gorevi
export function UserDutySelect({ form, required = false, isDisabled = false }: DutySelectProps) {
  const [duties, setDuties] = useState<{ value: string; label: string }[]>([]);
  const service =  useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  useEffect(() => {
    fetchDutyData();
  }, []);

  const fetchDutyData = async () => {
    try {
      const response = await service.getUserDuties();

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
  const selectedValues = form.values.dutiesIds 
    ? form.values.dutiesIds.split(',').filter(Boolean)
    : [];

  // Değer değiştiğinde array'i string'e çevirip form'a set et
  const handleChange = (values: string[]) => {
    form.setFieldValue('dutiesIds', values.join(','));
  };
  // Form'dan error mesajını al
  const error = form.errors.dutiesIds;

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
      error={error}
      maxDropdownHeight={200}
      nothingFoundMessage="Görevi bulunamadı..."
      onChange={handleChange}
    />
  );
}
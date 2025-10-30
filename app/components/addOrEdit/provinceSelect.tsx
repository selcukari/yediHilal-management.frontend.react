import { Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useProvinceService } from '../../services/provinceService'

interface ProvinceSelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  countryId?: string;
  disabled?: boolean;
  valueId?: string | null;
}

export function ProvinceSelect({ 
  form, 
  label = "İl", 
  placeholder = "İl Seçiniz", 
  required = false,
  countryId, valueId,
  disabled = false
}: ProvinceSelectProps) {

  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>([]);

  const service = useProvinceService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  useEffect(() => {
    fetchProvinceData(countryId);
  }, [countryId]);

  useEffect(() => {
    setTimeout(() => {
      form.setFieldValue('provinceId', valueId ?? form.values.provinceId);
    }, 400);
  }, []);

  const fetchProvinceData = async (countryId?: string) => {
    try {

      const getProvinces = await service.getProvinces(countryId);
      if (getProvinces) {
        setProvinces(
          getProvinces.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );

      } else {
        console.error('No getProvinces data found');
      }
    } catch (error: any) {
      console.error('Error fetching getProvinces:', error.message);
    }
  }
  
  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={provinces}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="İl bulunamadı"
      required={required}
      disabled={disabled}
      {...form.getInputProps('provinceId')}
    />
  );
}
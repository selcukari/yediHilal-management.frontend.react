import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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

  const service = useProvinceService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const { data: provinces = [], isLoading } = useQuery({
    queryKey: ["provinces", countryId],
    enabled: !!countryId, // countryId boşsa API çağrısı yapmaz
    queryFn: async () => {
      const response = await service.getProvinces(countryId);

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  useEffect(() => {
    setTimeout(() => {
      form.setFieldValue('provinceId', valueId ?? form.values.provinceId);
    }, 400);
  }, []);

  
  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={provinces}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="İl bulunamadı"
      required={required}
      disabled={disabled || isLoading}
      {...form.getInputProps('provinceId')}
    />
  );
}
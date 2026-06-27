import { MultiSelect } from '@mantine/core';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useMemberTypeService } from '../../services/memberTypeService';

interface MemberTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  disabled?: boolean;
  valueId?: string | null;
}

export function MemberTypeSelect({ form, required = false, disabled = false, valueId }: MemberTypeSelectProps) {
  
  const service = useMemberTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    setTimeout(() => {
      form.setFieldValue('typeIds', valueId ?? form.values.typeIds);
    }, 400);
  }, []);



  const { data: memberTypes = [], isLoading, isError } = useQuery({
    queryKey: ["memberTypes"],
    queryFn: async () => {
      const response = await service.getMemberTypes();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

    // Form değerini string'ten array'e çevir
  const selectedValues = form.values.typeIds 
    ? form.values.typeIds?.split(',').filter(Boolean)
    : [];

  const handleChange = (values: string[]) => {
    form.setFieldValue('typeIds', values.join(','));
  };
  // Form'dan error mesajını al
  const error = form.errors.typeIds;

  return (
    <MultiSelect
      label="Üye Tipi"
      placeholder="Tipi Seçiniz"
      data={memberTypes}
      searchable
      clearable disabled={disabled || isLoading}
      value={selectedValues}
      error={error}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Üye tipleri yüklenemedi."
          : "Tipi bulunamadı..."
      }
      onChange={handleChange}
    />
  );
}
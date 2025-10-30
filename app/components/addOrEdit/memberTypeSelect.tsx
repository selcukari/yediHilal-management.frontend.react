import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useMemberTypeService } from '../../services/memberTypeService';

interface MemberTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  disabled?: boolean;
  valueId?: string | null;
}

export function MemberTypeSelect({ form, required = false, disabled = false, valueId }: MemberTypeSelectProps) {
  const [memberTypes, setMemberTypes] = useState<{ value: string; label: string }[]>([]);
  
  const service = useMemberTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchMemberTypeData();

    setTimeout(() => {
      form.setFieldValue('typeIds', valueId ?? form.values.typeIds);
    }, 400);
  }, []);

  const fetchMemberTypeData = async () => {
    try {
      const response = await service.getMemberTypes();

      if (response) {
        setMemberTypes(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No fetchMemberTypeData data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetchMemberTypeData:', error.message);
    }
  };

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
      clearable disabled={disabled}
      value={selectedValues}
      error={error}
      maxDropdownHeight={200}
      nothingFoundMessage="Tipi bulunamadı..."
      onChange={handleChange}
    />
  );
}
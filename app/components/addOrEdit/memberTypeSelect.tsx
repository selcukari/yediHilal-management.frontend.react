import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useMemberTypeService } from '../../services/memberTypeService';

interface MemberTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
}

export function MemberTypeSelect({ form, required = false, }: MemberTypeSelectProps) {
  const [memberTypes, setMemberTypes] = useState<{ value: string; label: string }[]>([]);
  
  const service = useMemberTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchMemberTypeData();
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

  return (
    <Select
      label="Tipi"
      placeholder="Tipi Seçiniz"
      data={memberTypes}
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="Tipi bulunamadı..."
      {...form.getInputProps('typeId')}
    />
  );
}
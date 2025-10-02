import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useProgramTypeService } from '../../services/programTypeService';

interface ProgramTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  isDisabled?: boolean;
}

export function ProgramTypeSelect({ form, required = false, isDisabled = false }: ProgramTypeSelectProps) {
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  
  const service = useProgramTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchProgramTypeData();
  }, []);

  const fetchProgramTypeData = async () => {
    try {
      const response = await service.getProgramTypes();

      if (response) {
        setRoles(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No fetchProgramTypeData data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetchProgramTypeData:', error.message);
    }
  };

  // Form'dan error mesajını al
  const error = form.errors.programTypeId;

  return (
    <Select
      label="Program Türü"
      placeholder="program türü Seçiniz"
      data={roles}
      error={error}
      required={required}
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="program türü bulunamadı..."
      {...form.getInputProps('programTypeId')}
    />
  );
}
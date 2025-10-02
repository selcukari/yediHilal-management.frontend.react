import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useProgramTypeService } from '../../services/programTypeService';

interface ProgramTypeProps {
  onProgramTypeChange: (val: string | null) => void;
}

export function ProgramType({ onProgramTypeChange }: ProgramTypeProps) {
  const [programTypes, setProgramTypes] = useState<{ value: string; label: string }[]>([]);
  const [programType, setProgramType] = useState<string | null>("");
  
  const service = useProgramTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchProgramTypeData();
  }, []);

  const fetchProgramTypeData = async () => {
    try {
      const response = await service.getProgramTypes();

      if (response) {
        setProgramTypes(
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
  const handleChange = (value: string | null) => {
    onProgramTypeChange(value);
    setProgramType(value);
  };

  return (
    <Select
      label="Program Türü" placeholder="program türü Seçiniz" data={programTypes} value={programType}
      maxDropdownHeight={200} nothingFoundMessage="program türü bulunamadı..." clearable
      onChange={handleChange}
    />
  );
}
import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
  import { useProgramTypeService } from '../../services/programTypeService';

interface ProgramTypeProps {
  onProgramTypeChange: (val: string | null) => void;
}

export function ProgramType({ onProgramTypeChange }: ProgramTypeProps) {
  const [programType, setProgramType] = useState<string | null>("");
  
  const service = useProgramTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: programTypes = [] } = useQuery({
    queryKey: ["programTypes"],
    queryFn: async () => {
      const response = await service.getProgramTypes();
      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

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
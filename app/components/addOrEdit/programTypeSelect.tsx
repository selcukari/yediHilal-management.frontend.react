import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useProgramTypeService } from '../../services/programTypeService';
interface ProgramTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  isDisabled?: boolean;
}

export function ProgramTypeSelect({ form, required = false, isDisabled = false }: ProgramTypeSelectProps) {
  
  const service = useProgramTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
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

  // Form'dan error mesajını al
  const error = form.errors.programTypeId;

  return (
    <Select
      label="Program Türü"
      placeholder="program türü Seçiniz"
      data={roles}
      error={error}
      required={required}
      disabled={isDisabled || isLoading}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isLoading
          ? "Program türleri yükleniyor..."
          : "Program türü bulunamadı..."
      }
      {...form.getInputProps('programTypeId')}
    />
  );
}
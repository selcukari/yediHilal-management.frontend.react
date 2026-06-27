import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { priorityMockData } from '../../utils/priorityMockData';
interface PrioritySelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
}

export function PrioritySelect({ form, required = false }: PrioritySelectProps) {
  
  const { data: priorities = [] } = useQuery({
    queryKey: ["priorities"],
    queryFn: () => {

      return priorityMockData;
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  return (
    <Select
      label="Öncelik sırası"
      placeholder="Öncelik sırası Seçiniz"
      data={priorities}
      value="medium"
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="öncelik bulunamadı..."
      {...form.getInputProps('priority')}
    />
  );
}
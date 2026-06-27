import { MultiSelect } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useUserDutyService } from '../../services/userDutyService'; 
interface DutySelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}
// gorevi
export function UserDutySelect({ form, required = false, isDisabled = false }: DutySelectProps) {
  const service =  useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const { data: duties = [], isLoading, isError } = useQuery({
    queryKey: ["duties"],
    queryFn: async () => {
      const response = await service.getUserDuties();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  // Form değerini string'ten array'e çevir
  const selectedValues = form.values.dutiesIds 
    ? form.values.dutiesIds.split(',').filter(Boolean)
    : [];

  // Değer değiştiğinde array'i string'e çevirip form'a set et
  const handleChange = (values: string[]) => {
    form.setFieldValue('dutiesIds', values.join(','));
  };
  // Form'dan error mesajını al
  const error = form.errors.dutiesIds;

  return (
    <MultiSelect
      label="Görevi"
      placeholder="Görevi Seçiniz"
      data={duties}
      searchable
      clearable
      disabled={isDisabled || isLoading}
      value={selectedValues}
      required={required}
      error={error}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Görevler yükleniyor..."
          : "Görev bulunamadı..."
      }
      onChange={handleChange}
    />
  );
}
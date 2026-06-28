import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useUserService } from '../../services/userService';
interface ResponsibleUserSelectProps {
  form: UseFormReturnType<any>;
  countryId?: string;
  isDisabled?: boolean;
  required?: boolean;
}

export function ResponsibleUserSelect({ form, countryId = '1', isDisabled = false, required = false }: ResponsibleUserSelectProps) {
  
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: responsiblesUsers = [], isLoading, isError } = useQuery({
    queryKey: ["responsiblesUsers", countryId],
    enabled: !!countryId, // countryId boşsa API çağrısı yapmaz
    queryFn: async () => {
      const response = await service.usersInCache(countryId);

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.fullName,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  return (
    <Select
      label="Sorumlu"
      placeholder="Sorumlu Seçiniz"
      data={responsiblesUsers}
      searchable
      clearable
      // value={form.values.responsibleId}
      required={required}
      disabled={isDisabled || isLoading}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Sorumlu kullanıcılar yükleniyor..."
          : "Sorumlu kullanıcı bulunamadı..."
      }
      {...form.getInputProps('responsibleId')}
    />
  );
}
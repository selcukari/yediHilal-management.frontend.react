import { Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useCountryService } from '../../services/countryService';

interface CountrySelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CountrySelect({
  form,
  label = "Ülke",
  placeholder = "Ülke Seçiniz",
  required = false,
  disabled = false,
}: CountrySelectProps) {
  const service = useCountryService(
    import.meta.env.VITE_APP_API_BASE_CONTROLLER
  );

  const { data: countries = [], isLoading, isError } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await service.getCountries();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  return (
    <Select
      label={label}
      placeholder={
        isLoading ? "Ülkeler yükleniyor..." : placeholder
      }
      data={countries}
      value={form.values.countryId}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Ülkeler yüklenemedi."
          : "Ülke bulunamadı..."
      }
      required={required}
      disabled={disabled || isLoading}
      {...form.getInputProps('countryId')}
    />
  );
}
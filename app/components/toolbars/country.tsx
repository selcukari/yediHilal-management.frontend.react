import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '../../utils/toastMessages';
import { useCountryService } from '../../services/countryService'

interface CountryProps {
  isRequired?: boolean;
  isDisabled?: boolean;
  valueId?: string | null;
  onCountryChange: (val: string | null, name?: string) => void;
}

interface CountryOption {
  value: string;
  label: string;
}

interface CountryResponse {
  id: number;
  name: string;
}

export function Country({ isRequired = false, isDisabled = false, valueId,
  onCountryChange,
 }: CountryProps) {
  const [county, setCountry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
  const service = useCountryService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  useEffect(() => {
    setCountry(valueId ? valueId : "1"); // turkiye default olarak seçili
  }, []);

  const { data: countries = []} = useQuery<CountryOption[], Error>({
    queryKey: ["countries"],
    queryFn: async (): Promise<CountryOption[]> => {
      const response = await service.getCountries();

      return (response ?? []).map((c: CountryResponse) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  const handleChange = (value: string | null): void => {
    onCountryChange(value, value ? countries.find((c: CountryOption) => c.value == value)?.label : undefined);
    setCountry(value);
  };

  return (
    <Select
      label="Ülke"
      placeholder="Ülke Seçiniz"
      data={countries}
      value={county}
      searchable
      maxDropdownHeight={200}
      disabled={isDisabled}
      nothingFoundMessage="ülke bulunamadı..."
      onChange={handleChange}
      error={error}
      required={isRequired}
    />
  );
}
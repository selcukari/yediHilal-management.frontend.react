import { Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useCountryService } from '../../services/countryService'

interface CountrySelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function CountrySelect({ 
  form, 
  label = "Ülke", 
  placeholder = "Ülke Seçiniz", 
  required = false 
}: CountrySelectProps) {

  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);

  const service = useCountryService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  useEffect(() => {
    fetchCountryData();
  }, []);

  const fetchCountryData = async () => {
    try {
      const response = await service.getCountries();

      if (response) {
        setCountries(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No countries data found');
      }
    } catch (error: any) {
      console.error('Error fetching countries:', error.message);
    }
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={countries}
      value={form.values.countryId}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Ülke bulunamadı..."
      required={required}
      {...form.getInputProps('countryId')}
    />
  );
}
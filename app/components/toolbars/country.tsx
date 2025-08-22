import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useCountryService } from '../../services/countryService'

interface CountryProps {
  isRequired?: boolean;
  isDisabled?: boolean;
  onCountryChange: (val: string | null, name?: string) => void;
}

export function Country({ isRequired = false, isDisabled = false,
  onCountryChange,
 }: CountryProps) {
  const [county, setCountry] = useState<string | null>("1");
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
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

  const handleChange = (value: string | null) => {
    onCountryChange(value, value ? countries.find(c => c.value == value)?.label : undefined);
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
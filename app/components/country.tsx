import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useCountryService } from '../services/countryService'

interface CountryProps {
  isRequired?: boolean;
  isDisabled?: boolean;
}


export function Country({ isRequired = false, isDisabled = false }: CountryProps) {
  const [country, setCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
  const service = useCountryService('management');

  useEffect(() => {
    console.log('Component ilk açıldığında çalıştı ✅');
    fetchCountryData();
  }, []);

  const fetchCountryData = async () => {
    try {
      // örnek: API’den veriyi çek
      const response = await service.getCountries();

      console.log('reponse:', response)

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
    console.log("value:", value)
    setCountry(value);
    if (value) {
      setError(null);
    }
  };

  return (
    <Select
      label="Ülke"
      placeholder="Ülke Seçiniz"
      data={countries}
      searchable
      maxDropdownHeight={200}
      disabled={isDisabled}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
    />
  );
}
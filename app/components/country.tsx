import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useCountryService } from '../services/countryService'

interface CountryProps {
  isRequired?: boolean;
  isDisabled?: boolean;
  model?: string | null;
  onCountryChange: (val: string | null) => void;
  countrySelectedName: (val: string | null) => void;
}


export function Country({ isRequired = false, isDisabled = false, model = null,
  onCountryChange, countrySelectedName
 }: CountryProps) {
  const [country, setCountry] = useState<string | null>(model);
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
  const service = useCountryService('management');

  useEffect(() => {
    fetchCountryData();
  }, []);

  useEffect(() => {
    if (country) {
      setError(null);
    } else {
    }
  }, [country]);

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
    if (value) {
      setCountry(value);

      onCountryChange(country)
      setError(null);

      const selectedCountry = countries.find(country => country.value == value);
      if (selectedCountry) {
        countrySelectedName(selectedCountry.label);
      } else {
        countrySelectedName(null);
      }
    }
  };

  return (
    <Select
      label="Ülke"
      placeholder="Ülke Seçiniz"
      data={countries}
      value={country}
      searchable
      maxDropdownHeight={200}
      disabled={isDisabled}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
      required
    />
  );
}
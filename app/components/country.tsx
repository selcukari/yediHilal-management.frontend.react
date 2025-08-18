import { Select } from '@mantine/core';
import { useState } from 'react';

interface CountryProps {
  isRequired?: boolean;
  isDisabled?: boolean;
}

export function Country({ isRequired = false, isDisabled = false }: CountryProps) {
  const [country, setCountry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);

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
      data={[{ value: 'react', label: 'React' }, { value: 'angular', label: 'Angular' }, { value: 'vue', label: 'Vue' }, { value: 'svelte', label: 'Svelte'}]}
      searchable
      maxDropdownHeight={200}
      disabled={isDisabled}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
    />
  );
}
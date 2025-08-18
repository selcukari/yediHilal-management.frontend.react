import { Select } from '@mantine/core';
import { useState } from 'react';

interface ProvinceProps {
  isRequired?: boolean;
}

export function Province({ isRequired = false }: ProvinceProps) {
  const [province, setProvince] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(isRequired ? 'İl alanı gereklidir.' : null);
  
  const handleChange = (value: string | null) => {
    console.log("value:", value)
    setProvince(value);
    if (value) {
      setError(null);
    }
  };
  return (
    <Select
      label="İl"
      placeholder="İl Seçiniz"
      data={[{ value: 'react', label: 'React' }, { value: 'angular', label: 'Angular' }, { value: 'vue', label: 'Vue' }, { value: 'svelte', label: 'Svelte'}]}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
    />
  );
}
import { Select } from '@mantine/core';
import { useState } from 'react';

interface AreaProps {
  isRequired?: boolean;
}

export function Area({ isRequired = false }: AreaProps) {
  const [area, setArea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(isRequired ? 'Bölge alanı gereklidir.' : null);
  
  const handleChange = (value: string | null) => {
    console.log("value:", value)
    setArea(value);
    if (value) {
      setError(null);
    }
  };

  return (
    <Select
      label="Bölge"
      placeholder="Bölge Seçiniz"
      data={[{ value: 'react', label: 'React' }, { value: 'angular', label: 'Angular' }, { value: 'vue', label: 'Vue' }, { value: 'svelte', label: 'Svelte'}]}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
      required
    />
  );
}
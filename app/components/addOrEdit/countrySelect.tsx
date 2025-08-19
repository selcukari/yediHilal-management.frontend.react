import { Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

interface CountrySelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const countryData = [
  { value: "1", label: 'Türkiye' },
  { value: "2", label: 'Abd' },
  { value: "3", label: 'Azerbeycan' },
  { value: "4", label: 'Almanya' },
  { value: "5", label: 'Fransa' },
  { value: "6", label: 'İngiltere' },
  // Daha fazla ülke ekleyebilirsiniz
];

export function CountrySelect({ 
  form, 
  label = "Ülke", 
  placeholder = "Ülke Seçiniz", 
  required = false 
}: CountrySelectProps) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={countryData}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Ülke bulunamadı..."
      required={required}
      {...form.getInputProps('country')}
    />
  );
}
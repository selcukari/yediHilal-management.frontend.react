import { Select } from '@mantine/core';

export function Area() {
  return (
    <Select
      label="Your favorite library"
      placeholder="Pick value"
      data={[{ value: 'react', label: 'React' }, { value: 'Angular', label: 'Vue' }, { value: 'svelte', label: 'Svelte'}]}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Nothing found..."
    />
  );
}
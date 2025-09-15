import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { priorityMockData } from '../../utils/priorityMockData';

interface PrioritySelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
}

export function PrioritySelect({ form, required = false }: PrioritySelectProps) {
  const [priorities, setPriorities] = useState<{ value: string; label: string }[]>([]);
  
  useEffect(() => {
    fetchPriorityData();
  }, []);

  const fetchPriorityData = () => {
    try {

      setPriorities(priorityMockData);
      
    } catch (error: any) {
      console.error('Error fetching priority:', error.message);
    }
  };

  return (
    <Select
      label="Öncelik sırası"
      placeholder="Öncelik sırası Seçiniz"
      data={priorities}
      value="medium"
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="öncelik bulunamadı..."
      {...form.getInputProps('priority')}
    />
  );
}
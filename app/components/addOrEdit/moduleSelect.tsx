import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { modulesMockData } from '~/utils/modules';

interface ModuleSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}

export function ModuleSelect({ form, required = false, isDisabled = false }: ModuleSelectProps) {
  const [modules, setModules] = useState<{ value: string; label: string }[]>([]);
  
  useEffect(() => {
    fetchRoleData();
  }, []);

  const fetchRoleData = async () => {
      
    setModules(
      modulesMockData.map((c: any) => ({
        value: c.key,
        label: c.label,
      }))
    );
     
  };

  // Form değerini string'ten array'e çevir
  const selectedValues = form.values.moduleRoles 
    ? form.values.moduleRoles.split(',').filter(Boolean)
    : [];

  // Değer değiştiğinde array'i string'e çevirip form'a set et
  const handleChange = (values: string[]) => {
    form.setFieldValue('moduleRoles', values.join(','));
  };

  return (
    <MultiSelect
      label="Modül yetki"
      placeholder="modül seçiniz"
      data={modules}
      searchable
      clearable
      disabled={isDisabled}
      value={selectedValues}
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="Modül bulunamadı..."
      onChange={handleChange}
    />
  );
}
import { MultiSelect } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { modulesMockData } from '~/utils/modules';
interface ModuleSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}

export function ModuleSelect({ form, required = false, isDisabled = false }: ModuleSelectProps) {

   const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: () => {

      return (modulesMockData).map((c: any) => ({
        value: String(c.key),
        label: c.label,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

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
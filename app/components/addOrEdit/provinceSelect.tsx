import { Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

interface ProvinceSelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  countryId?: string; // Ülkeye göre illeri filtrelemek için
}

// Ülkelere göre iller (gerçek uygulamada API'den çekebilirsiniz)
const provinceData = {
  '1': [ // Türkiye
    { value: "34", label: 'İstanbul' },
    { value: "6", label: 'Ankara' },
    { value: "35", label: 'İzmir' },
    { value: "7", label: 'Antalya' },
    { value: "33", label: 'Mersin' },
    { value: "65", label: 'Van' },
  ],
  '2': [ // ABD
    { value: "ny", label: 'New York' },
    { value: "ca", label: 'California' },
    { value: "tx", label: 'Texas' },
  ],
  '3': [ // Azerbeycan
    { value: "baku", label: 'Bakü' },
    { value: "ganja", label: 'Gence' },
  ],
  'default': [
    { value: "1", label: 'Mersin' },
    { value: "2", label: 'Ankara' },
    { value: "3", label: 'Van' }
  ]
};

export function ProvinceSelect({ 
  form, 
  label = "İl", 
  placeholder = "İl Seçiniz", 
  required = false,
  countryId 
}: ProvinceSelectProps) {
  
  const getProvinces = () => {
    if (countryId && provinceData[countryId as keyof typeof provinceData]) {
      return provinceData[countryId as keyof typeof provinceData];
    }
    return provinceData.default;
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={getProvinces()}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="İl bulunamadı"
      required={required}
      {...form.getInputProps('province')}
    />
  );
}
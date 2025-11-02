import { Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useDistrictService } from '../../services/districtService'

interface DistrictSelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  provinceId?: string;
  disabled?: boolean;
  valueId?: string | null;
}

export function DistrictceSelect({ 
  form, 
  label = "İlçe", 
  placeholder = "İlçe Seçiniz", 
  required = false,
  provinceId, valueId,
  disabled = false
}: DistrictSelectProps) {

  const [districts, setDistricts] = useState<{ value: string; label: string }[]>([]);

  const service = useDistrictService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  useEffect(() => {
    if (provinceId) {
      fetchProvinceData(provinceId);
    }
  }, [provinceId]);

  useEffect(() => {
    setTimeout(() => {
      form.setFieldValue('districtId', valueId ?? form.values.districtId);
    }, 400);
  }, []);

  const fetchProvinceData = async (countryId?: string) => {
    try {

      const getDistricts = await service.getDistricts(countryId);
      if (getDistricts) {
        setDistricts(
          getDistricts.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );

      } else {
        setDistricts([]);
        console.error('No getDistricts data found');
      }
    } catch (error: any) {
      setDistricts([]);
      console.error('Error fetching getDistricts:', error.message);
    }
  }
  
  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={districts}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="İlçe bulunamadı"
      required={required}
      disabled={disabled || districts.length < 1}
      {...form.getInputProps('districtId')}
    />
  );
}
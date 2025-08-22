import { Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useProvinceService } from '../../services/provinceService'

interface ProvinceProps {
  isRequired?: boolean;
  isDisabled?: boolean;
  countryId?: string | null;
  onProvinceChange: (val: string | null, name?: string) => void;
}

export function Province({ 
 isRequired = false, countryId, isDisabled = false, onProvinceChange,
}: ProvinceProps) {
  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>([]);
  const [province, setProvince] = useState<string | null>("");
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
  const service = useProvinceService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  useEffect(() => {
    fetchProvinceData(countryId);
    setProvince("");
  }, [countryId]);

  const fetchProvinceData = async (countryId?: string | null) => {
    try {

      const getProvinces = await service.getProvinces(countryId);
      if (getProvinces) {
        setProvinces(
          getProvinces.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );

      } else {
        console.error('No getProvinces data found');
      }
    } catch (error: any) {
      console.error('Error fetching getProvinces:', error.message);
    }
  }

  const handleChange = (value: string | null) => {
    onProvinceChange(value, value ? provinces.find(p => p.value == value)?.label : undefined);
    setProvince(value);
  };
  
  return (
    <Select
      label="İl"
      placeholder="İl Seçiniz"
      data={provinces}
      value={province}
      searchable
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="İl bulunamadı..."
      required={isRequired}
      error={error}
      onChange={handleChange}
      clearable
    />
  );
}
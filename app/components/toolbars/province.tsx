import { MultiSelect } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProvinceService } from '../../services/provinceService'

interface ProvinceOption {
  value: string;
  label: string;
}

interface ProvinceResponse {
  id: string;
  name: string;
}

interface ProvinceService {
  getProvinces(countryId?: string | null): Promise<ProvinceResponse[] | null>;
}

interface ProvinceProps {
  isRequired?: boolean;
  isDisabled?: boolean;
  countryId?: string | null;
  valueId?: string | null;
  onProvinceChange: (vals: string[], names?: string[]) => void;
}

export function Province({ 
 isRequired = false, countryId, isDisabled = false, onProvinceChange, valueId,
}: ProvinceProps) {
  const [province, setProvince] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(isRequired ? 'Ülke alanı gereklidir.' : null);
  
  const service: ProvinceService = useProvinceService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  
  useEffect(() => {
    setProvince(valueId ? [valueId] : undefined);
  }, [countryId]);


  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {

      const response = await service.getProvinces(countryId);

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  const handleChange = (values: string[]) => {
    const selectedProvinceNames = values.map(value => {
    const province = provinces.find(p => p.value == value);
    return province?.label || '';
  }).filter(name => name != '');
  
    onProvinceChange(values, selectedProvinceNames); // ikinci paremetre provinces in value degerine esiş olan values den gelen provinces label string oluştur
    setProvince(values);
  };
  
  return (
    <MultiSelect
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
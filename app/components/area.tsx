import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAreaService } from '../services/areaService'

interface AreaProps {
  isRequired?: boolean;
}

export function Area({ isRequired = false }: AreaProps) {
  const [area, setArea] = useState<string | null>(null);
  const [areas, setAreas] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(isRequired ? 'Bölge alanı gereklidir.' : null);
  
  const service = useAreaService('management');
  
  useEffect(() => {
    fetchAreaData();
  }, []);

  const fetchAreaData = async () => {
    try {
      const response = await service.getAreas();

      if (response) {
        setAreas(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No countries data found');
      }
    } catch (error: any) {
      console.error('Error fetching countries:', error.message);
    }
  };

  const handleChange = (value: string | null) => {
    setArea(value);
    if (value) {
      setError(null);
    }
  };

  return (
    <Select
      label="Bölge"
      placeholder="Bölge Seçiniz"
      data={areas}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage="Nothing found..."
      onChange={handleChange}
      error={error}
      required
    />
  );
}
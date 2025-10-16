import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import { toast } from '../../utils/toastMessages';
import { useUserDutyService } from '../../services/userDutyService';

interface UserDutyProps {
  onUserDutyChange: (vals: string[] | null, names?: string[] | null) => void;
}

export function UserDuty({ onUserDutyChange }: UserDutyProps) {
  const [userDuty, setUserDuty] = useState<string[] | undefined>(undefined);
  const [userDuties, setUserDuties] = useState<{ value: string; label: string }[]>([]);
  
  const service = useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchUserDutyData();
  }, []);

  const fetchUserDutyData = async () => {
    try {
      const response = await service.getUserDuties();

      if (response) {
        setUserDuties(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        toast.info('Hiçbir veri yok!');
      }
    } catch (error: any) {
      toast.error(`görev yüklenirken hata: ${error.message}`);
    }
  };

  const handleChange = (values: string[]) => {
    const selectedUserDutyNames = values.map(value => {
    const memberType = userDuties.find(p => p.value == value);
    return memberType?.label || '';
  }).filter(name => name != '');
  
    onUserDutyChange(values, selectedUserDutyNames); // ikinci paremetre provinces in value degerine esiş olan values den gelen provinces label string oluştur
    setUserDuty(values);
  };

  return (
    <MultiSelect
      label="Görev"
      placeholder="görev Seçiniz"
      data={userDuties}
      value={userDuty}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="görev bulunamadı..."
      onChange={handleChange}
    />
  );
}
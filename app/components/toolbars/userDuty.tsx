import { MultiSelect } from '@mantine/core';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserDutyService } from '../../services/userDutyService';

interface UserDutyOption {
  value: string;
  label: string;
}

interface UserDutyResponse {
  id: number | string;
  name: string;
}

interface UserDutyProps {
  onUserDutyChange: (vals: string[] | null, names?: string[] | null) => void;
}

export function UserDuty({ onUserDutyChange }: UserDutyProps) {
  const [userDuty, setUserDuty] = useState<string[] | undefined>(undefined);
  
  const service: ReturnType<typeof useUserDutyService> = useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: userDuties = [] } = useQuery({
    queryKey: ["userDuties"],
    queryFn: async () => {
      const response = await service.getUserDuties();

      return (response ?? []).map((c: UserDutyResponse) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  const handleChange = (values: string[]) => {
    const selectedUserDutyNames = values.map(value => {
    const memberType: UserDutyOption | undefined = userDuties.find((p: UserDutyOption) => p.value == value);
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
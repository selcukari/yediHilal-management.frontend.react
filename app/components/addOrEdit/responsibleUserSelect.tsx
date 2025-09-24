import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useUserService } from '../../services/userService';

interface ResponsibleUserSelectProps {
  form: UseFormReturnType<any>;
  countryId?: string;
  isDisabled?: boolean;
  required?: boolean;
}

export function ResponsibleUserSelect({ form, countryId, isDisabled = false, required = false }: ResponsibleUserSelectProps) {
  const [responsiblesUsers, setResponsiblesUsers] = useState<{ value: string; label: string }[]>([]);
  
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetcReferansUsersData(countryId);
  }, [countryId]);

  const fetcReferansUsersData = async (countryId?: string) => {
    try {
      const response = await service.usersInCache(countryId);

      if (response) {
        setResponsiblesUsers(
          response
            .map((c: any) => ({
              value: String(c.id),
              label: c.fullName,
            }))
        );
      } else {
        console.error('No fetcReferansMembersData data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetcReferansMembersData:', error.message);
    }
  };

  return (
    <Select
      label="Sorumlu"
      placeholder="Sorumlu Seçiniz"
      data={responsiblesUsers}
      searchable
      clearable
      // value={form.values.responsibleId}
      required={required}
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="Sorumlu bulunamadı..."
      {...form.getInputProps('responsibleId')}
    />
  );
}
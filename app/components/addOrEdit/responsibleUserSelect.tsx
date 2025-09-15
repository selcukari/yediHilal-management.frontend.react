import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useUserService } from '../../services/userService';

interface ResponsibleUserSelectProps {
  form: UseFormReturnType<any>;
  countryId?: string;
  isDisabled?: boolean;
  required: boolean;
  responsibleId?: string;
  onResponsibleChange: (val: string | null, name?: string | null) => void;
}

export function ResponsibleUserSelect({ form, countryId, onResponsibleChange, isDisabled = false, required = false, responsibleId }: ResponsibleUserSelectProps) {
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
            .filter((c: any) => String(c.id) != responsibleId)
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

  const handleChange = (value: string | null) => {
    if (!value) return;
    onResponsibleChange(value, responsiblesUsers.find(i => i.value == value)?.label);
  };
   // Form'dan error mesajını al
  const error = form.errors.responsibleId;

  return (
    <Select
      label="Sorumlu"
      placeholder="Sorumlu Seçiniz"
      data={responsiblesUsers}
      error={error}
      searchable
      clearable
      required={required}
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="Sorumlu bulunamadı..."
      onChange={handleChange}
    />
  );
}
import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useUserDutyService } from '../../services/userDutyService'; 

interface MeetingTypeSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string[];
  isDisabled?: boolean;
}
// gorevi
export function MeetingTypeSelect({ form, required = false, isDisabled = false }: MeetingTypeSelectProps) {
  const [meetings, setMeetings] = useState<{ value: string; label: string }[]>([]);
  const service =  useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  useEffect(() => {
    fetchMeetingTypeData();
  }, []);

  const fetchMeetingTypeData = async () => {
    try {
      const response = await service.getUserDuties();

      if (response) {
        setMeetings(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No fetchMeetingTypeData data found');
      }
    } catch (error: any) {
      console.error('Error fetching fetchMeetingTypeData:', error.message);
    }
  };

  return (
    <Select
      label="Toplantı Birim"
      placeholder="toplantı birim seçiniz"
      data={meetings}
      searchable
      clearable
      required={required}
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="toplantı birim bulunamadı..."
      {...form.getInputProps('meetingTypeId')}
    />
  );
}
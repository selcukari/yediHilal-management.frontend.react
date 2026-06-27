import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
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
  const service =  useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const { data: meetings = [], isLoading, isError } = useQuery({
    queryKey: ["userDuties"],
    queryFn: async () => {
      const response = await service.getUserDuties();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  return (
    <Select
      label="Toplantı Birim"
      placeholder={isLoading ? "Toplantı birimleri yükleniyor..." : "Toplantı birimi seçiniz"}
      data={meetings}
      searchable
      clearable
       nothingFoundMessage={
        isError
          ? "Toplantı birimleri yüklenemedi."
          : "Toplantı birimi bulunamadı..."
      }
      required={required}
      disabled={ isDisabled || isLoading}
      maxDropdownHeight={200}
      {...form.getInputProps('meetingTypeId')}
    />
  );
}
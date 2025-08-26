import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useMemberService } from '../../services/memberService';

interface ReferansMemberSelectProps {
  form: UseFormReturnType<any>;
  countryId?: string;
  isDisabled: boolean;
  memberId?: string;
}

export function ReferansMemberSelect({ form, countryId, isDisabled = false, memberId }: ReferansMemberSelectProps) {
  const [referansMembers, setReferansMembers] = useState<{ value: string; label: string }[]>([]);
  
  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  useEffect(() => {
    fetcReferansMembersData(countryId);
  }, [countryId]);

  const fetcReferansMembersData = async (countryId?: string) => {
    try {
      const response = await service.membersInCache(countryId);

      if (response) {
        setReferansMembers(
          response
            .filter((c: any) => String(c.id) != memberId)
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
      label="Referans"
      placeholder="Referans Seçiniz"
      data={referansMembers}
      searchable
      clearable
      disabled={isDisabled}
      maxDropdownHeight={200}
      nothingFoundMessage="Referans bulunamadı..."
      {...form.getInputProps('referenceId')}
    />
  );
}
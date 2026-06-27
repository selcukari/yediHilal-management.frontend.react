import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useMemberService } from '../../services/memberService';
interface ReferansMemberSelectProps {
  form: UseFormReturnType<any>;
  countryId?: string;
  isDisabled: boolean;
  memberId?: string;
}

export function ReferansMemberSelect({ form, countryId, isDisabled = false, memberId }: ReferansMemberSelectProps) {
  
  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const { data: referansMembers = [], isLoading, isError } = useQuery({
    queryKey: ["referansMembers", countryId],
    enabled: !!countryId, // countryId boşsa API çağrısı yapmaz
    queryFn: async () => {
      const response = await service.membersInCache(countryId);

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.fullName,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  return (
    <Select
      label="Referans"
      placeholder="Referans Seçiniz"
      data={referansMembers}
      searchable
      clearable
      disabled={isDisabled || isLoading}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Referans üyeler yükleniyor..."
          : "Referans üye bulunamadı..."
      }
      {...form.getInputProps('referenceId')}
    />
  );
}
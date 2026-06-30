import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemberTypeService } from '../../services/memberTypeService';

interface MemberTypeProps {
  onMemberTypeChange: (vals: string[] | null, names?: string[] | null) => void;
  isDisabled?: boolean;
  valueId?: string[] | null;
}

export function MemberType({ onMemberTypeChange, isDisabled = false, valueId }: MemberTypeProps) {
  const [memberType, setMemberType] = useState<string[] | undefined>(undefined);
  
  const service = useMemberTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    setMemberType(valueId ? valueId : undefined);
  }, []);

  const { data: memberTypes = [] } = useQuery({
    queryKey: ["memberTypes"],
    queryFn: async () => {
      const response = await service.getMemberTypes();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 2, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 2, // 24 saat bellekte tut
  });

  const handleChange = (values: string[]) => {
    const selectedMemberTypeNames = values.map(value => {
    const memberType = memberTypes.find((p: { value: string; label: string }) => p.value === value);
    return memberType?.label || '';
  }).filter(name => name != '');
  
    onMemberTypeChange(values, selectedMemberTypeNames); // ikinci paremetre provinces in value degerine esiş olan values den gelen provinces label string oluştur
    setMemberType(values);
  };

  return (
    <MultiSelect
      label="Üye Tipi"
      placeholder="Üye Tipi Seçiniz"
      data={memberTypes}
      value={memberType}
      disabled={isDisabled}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="Üye tipi bulunamadı..."
      onChange={handleChange}
    />
  );
}
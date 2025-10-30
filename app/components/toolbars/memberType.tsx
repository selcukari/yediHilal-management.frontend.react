import { MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';
import { toast } from '../../utils/toastMessages';
import { useMemberTypeService } from '../../services/memberTypeService';

interface MemberTypeProps {
  onMemberTypeChange: (vals: string[] | null, names?: string[] | null) => void;
  isDisabled?: boolean;
  valueId?: string[] | null;
}

export function MemberType({ onMemberTypeChange, isDisabled = false, valueId }: MemberTypeProps) {
  const [memberType, setMemberType] = useState<string[] | undefined>(undefined);
  const [memberTypes, setMemberTypes] = useState<{ value: string; label: string }[]>([]);
  
  const service = useMemberTypeService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchRoleData();
    setMemberType(valueId ? valueId : undefined);
  }, []);

  const fetchRoleData = async () => {
    try {
      const response = await service.getMemberTypes();

      if (response) {
        setMemberTypes(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        toast.info('Hiçbir veri yok!');
      }
    } catch (error: any) {
      toast.error(`MemberTypes yüklenirken hata: ${error.message}`);
    }
  };

  const handleChange = (values: string[]) => {
    const selectedMemberTypeNames = values.map(value => {
    const memberType = memberTypes.find(p => p.value == value);
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
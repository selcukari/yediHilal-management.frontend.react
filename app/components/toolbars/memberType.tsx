import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useRoleService } from '../../services/roleService';

interface MemberTypeProps {
  onMemberTypeChange: (val: string | null, name?: string) => void;
}

export function MemberType({ onMemberTypeChange }: MemberTypeProps) {
  const [memberType, setMemberType] = useState<string | null>("");
  const [memberTypes, setMemberTypes] = useState<{ value: string; label: string }[]>([]);
  
  const service = useRoleService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchRoleData();
  }, []);

  const fetchRoleData = async () => {
    try {
      const response = await service.getRoles();

      if (response) {
        setMemberTypes(
          response.map((c: any) => ({
            value: String(c.id),
            label: c.name,
          }))
        );
      } else {
        console.error('No getRoles data found');
      }
    } catch (error: any) {
      console.error('Error fetching getRoles:', error.message);
    }
  };

  const handleChange = (value: string | null) => {
    onMemberTypeChange(value, value ? memberTypes.find(c => c.value == value)?.label : undefined);
    setMemberType(value);
  };

  return (
    <Select
      label="Üye Tipi"
      placeholder="Üye Tipi Seçiniz"
      data={memberTypes}
      value={memberType}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="Üye tipi bulunamadı..."
      onChange={handleChange}
    />
  );
}
import { Select } from '@mantine/core';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoleService } from '../../services/roleService';

interface RoleOption {
  value: string;
  label: string;
}

interface RoleProps {
  onRoleChange: (val: string | null, name?: string | null) => void;
}

export function Role({ onRoleChange }: RoleProps) {
  const [role, setRole] = useState<string | null>("");
  
  const service = useRoleService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: roles = [] } = useQuery<RoleOption[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await service.getRoles();

      return (response ?? []).map((c: any): RoleOption => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  const handleChange = (value: string | null) => {
    onRoleChange(value, value ? roles.find((c) => c.value == value)?.label : null);
    setRole(value);
  };

  return (
    <Select
      label="Role"
      placeholder="Role Seçiniz"
      data={roles}
      value={role}
      searchable
      clearable
      maxDropdownHeight={200}
      nothingFoundMessage="Role bulunamadı..."
      onChange={handleChange}
    />
  );
}
import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useRoleService } from '../../services/roleService';

interface RoleProps {
  onRoleChange: (val: string | null, name?: string | null) => void;
}

export function Role({ onRoleChange }: RoleProps) {
  const [role, setRole] = useState<string | null>("");
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  
  const service = useRoleService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  useEffect(() => {
    fetchRoleData();
  }, []);

  const fetchRoleData = async () => {
    try {
      const response = await service.getRoles();

      if (response) {
        setRoles(
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
    onRoleChange(value, value ? roles.find(c => c.value == value)?.label : null);
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
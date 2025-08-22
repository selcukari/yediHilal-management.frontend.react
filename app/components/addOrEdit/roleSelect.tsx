import { Select } from '@mantine/core';
import { useState, useEffect } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { useRoleService } from '../../services/roleService';

interface RoleSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
}

export function RoleSelect({ form, required = false, }: RoleSelectProps) {
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

  return (
    <Select
      label="Role"
      placeholder="Role Seçiniz"
      data={roles}
      required={required}
      maxDropdownHeight={200}
      nothingFoundMessage="Role bulunamadı..."
      {...form.getInputProps('roleId')}
    />
  );
}
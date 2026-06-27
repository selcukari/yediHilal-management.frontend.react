import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturnType } from '@mantine/form';
import { useRoleService } from '../../services/roleService';
interface RoleSelectProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  isDisabled?: boolean;
}

export function RoleSelect({ form, required = false, isDisabled = false }: RoleSelectProps) {
  
  const service = useRoleService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

   const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await service.getRoles();

      return (response ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gun cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // 24 saat bellekte tut
  });

  // Form'dan error mesajını al
  const error = form.errors.roleId;

  return (
    <Select
      label="Role"
      placeholder="Role Seçiniz"
      data={roles}
      error={error}
      required={required}
      disabled={isDisabled || isLoading}
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError
          ? "Roller yükleniyor..."
          : "Role bulunamadı..."
      }
      {...form.getInputProps('roleId')}
    />
  );
}
import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDistrictService } from "../../services/districtService";

interface DistrictSelectProps {
  form: UseFormReturnType<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  provinceId?: string;
  disabled?: boolean;
  valueId?: string | null;
}

export function DistrictSelect({
  form,
  label = "İlçe",
  placeholder = "İlçe Seçiniz",
  required = false,
  provinceId,
  valueId,
  disabled = false,
}: DistrictSelectProps) {
  const service = useDistrictService(
    import.meta.env.VITE_APP_API_BASE_CONTROLLER
  );

  const {
    data: districts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["districts", provinceId],
    enabled: !!provinceId, // provinceId boşsa API çağrısı yapmaz
    queryFn: async () => {
      const response = await service.getDistricts(provinceId);

      return (response ?? []).map((item: any) => ({
        value: String(item.id),
        label: item.name,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 hafta
    gcTime: 1000 * 60 * 60 * 24 * 7, // 1 hafta
  });

  useEffect(() => {
    if (valueId) {
      form.setFieldValue("districtId", valueId);
    }
  }, [valueId]);

  return (
    <Select
      label={label}
      placeholder={isLoading ? "Yükleniyor..." : placeholder}
      data={districts}
      searchable
      maxDropdownHeight={200}
      nothingFoundMessage={
        isError ? "İlçeler yüklenemedi." : "İlçe bulunamadı"
      }
      required={required}
      disabled={disabled || !provinceId || isLoading}
      {...form.getInputProps("districtId")}
    />
  );
}
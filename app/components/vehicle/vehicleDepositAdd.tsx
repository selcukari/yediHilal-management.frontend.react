import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Stack, Grid, Textarea, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useVehicleService } from '../../services/vehicleService';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';
import type { VehicleData } from '../../routes/vehicle/vehicle';

interface VehicleDepositAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type GetVehicleData = {
  id: string;
  plate: string;
  mileage: number;
  fuelLevel: string;
}
type GetUserData = {
  id: string;
  fullName: string;
}

type FormValues = {
  // teslim tarihi
  vehicleId: string | null;
  givenToId: number;
  givenById: string | null;
  note: string | null;
};
export type VehicleDepositAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

const VehicleDepositAdd = forwardRef<VehicleDepositAddDialogControllerRef, VehicleDepositAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [vehicleData, setVehicleData] = useState<GetVehicleData[]>([]);
  const [userData, setUserData] = useState<GetUserData[]>([]);

  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceVehicle = useVehicleService(import.meta.env.VITE_APP_API_VEHICLE_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
    vehicleId: "",
    givenToId: 0,
    givenById: "",
    note: '',
    },
    validate: {
      vehicleId: (value) => value ? null: "Araç alanı zorunlu",
      givenById: (value) => value ? null: "Teslim eden alanı zorunlu",
  
    },
  });

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);

      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    const newVehicleDepositValue = {
      ...values,
      givenToId: currentUser?.id as number,
      vehicleId: values.vehicleId ? parseInt(values.vehicleId) : 0,
      givenById: values.givenById ? parseInt(values.givenById) : 0,
    }

    const result = await serviceVehicle.addVehicleDeposit(newVehicleDepositValue);

    if (result === true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      close();
      form.reset();
      setIsDisabledSubmit(false);

      return;
    }
    if (result?.data === false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }

  const openDialog = () => {

    setTimeout(() => {
      fetchVehicle();
    }, 200);
    open();

  };

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));
  const fetchVehicle = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
      }

      const getVehicles: VehicleData[] | null = await serviceVehicle.getVehicles();
      const getUsers = await serviceUser.users(params);
      
      if (getVehicles && getUsers) {
        setVehicleData(getVehicles.filter(v => !v.isDeposit)?.map(i => ({ id: i.id.toString(), plate: i.plate, mileage: i.mileage || 0, fuelLevel: i.fuelLevel || '1/2' })));
        setUserData(getUsers.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
      } else {
        toast.info('Hiçbir veri yok!');
        setVehicleData([]);
        setUserData([]);
      }
    } catch (error: any) {
      toast.error(`Vehicles yüklenirken hata: ${error.message}`);
    }
  };

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Emanet Araç Ekle"
      centered
      size="700"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={4}>
              <Select
                label="Araç"
                placeholder="araç Seçiniz"
                data={vehicleData.map(item => ({ value: item.id, label: item.plate }))}
                searchable clearable required maxDropdownHeight={200}
                nothingFoundMessage="araç bulunamadı..."
                onChange={(value) => form.setFieldValue('vehicleId', value)}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Araçı Alan Kişi"
                placeholder="araç alan Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))}
                searchable clearable required maxDropdownHeight={200}
                nothingFoundMessage="teslim alan bulunamadı..."
                onChange={(value) => form.setFieldValue('givenById', value)}
              />
            </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Note"
              placeholder="messaj..."
              withAsterisk
              {...form.getInputProps('note')}
            />
          </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
              Kaydet
            </Button>
          </Grid.Col>
          </Grid>
        </Stack>
      </form>
    </Modal>
      {/* confirm Dialog */}
    <ConfirmModal 
      ref={confirmModalRef}
      onConfirm={confirmDialogHandleConfirm}
      onCancel={confirmDialogHandleCancel}
    />
  </>);
});

export default VehicleDepositAdd;
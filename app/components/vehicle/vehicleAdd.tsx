import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Textarea, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useVehicleService } from '../../services/vehicleService';
import { toast } from '../../utils/toastMessages';
import { useAuth } from '~/authContext';
import stripSpecialCharacters from '../../utils/stripSpecialCharacters';
import { mockDataFuelTypes, mockDataTransmissionTypes, mockDataFuelLevel } from '../../utils/vehicleMockData';
import { DayRenderer } from '../../components';
interface VehicleAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type GetVehicleData = {
  id: number;
  plate: string;
}

type FormValues = {
  plate: string;
  brand: string;
  model: string;
  color: string;
  // motor numarası
  engineNumber: string;
  // kilometresi
  mileage: string | null;
  // yakıt tipi(Gasoline/Diesel/Electric/Hybrid)
  fuelType: string | null;
  //Manual/Automatic
  transmission: string | null;
  // sigortaTarih
  insuranceDate?: string | null;
  // muane tarihi
  inspectionDate?: string | null;
  kaskoDate?: string | null;
  year: string | null;
  userId: number;
  fuelLevel: string | null;
  note: string | null;
  place: string | null;
};
export type VehicleAddDialogControllerRef = {
  openDialog: (values: GetVehicleData[]) => void;
  close: () => void;
};

const VehicleAdd = forwardRef<VehicleAddDialogControllerRef, VehicleAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [stockData, setStockData] = useState<GetVehicleData[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const service = useVehicleService(import.meta.env.VITE_APP_API_VEHICLE_CONTROLLER);
  const { currentUser } = useAuth();
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      userId: 0,
      plate: '',
      brand: '',
      model: '',
      color: '',
      engineNumber: '',
      mileage: "10",
      fuelType: '',
      transmission: '',
      insuranceDate: '',
      inspectionDate: '',
      year: `${new Date().getFullYear()}`,
      note: '',
      fuelLevel: '',
      kaskoDate: '',
      place: '',
    },
    validate: {
      plate: (value) => {
        if(!value.trim()) {
          return "Plaka alanı zorunlu.";
        }

        const plates = stockData?.map((item: GetVehicleData) => stripSpecialCharacters(item.plate));

        if(plates.includes(stripSpecialCharacters(value))) {

          return "Aynı plakalı araç tekrar eklenemez";
        }
      },
      fuelLevel: (value) => value ? null: "Yakıt durumu alanı zorunlu",
      brand: (value) => value ? null: "Marka alanı zorunlu",
      model: (value) => value ? null: "Model alanı zorunlu",
      fuelType: (value) => value ? null: "Yakıt tipi alanı zorunlu",
      transmission: (value) => value ? null: "Vites tipi alanı zorunlu",
      year: (value) => (parseInt(value ?? "1") > 1900 && parseInt(value ?? "1") <= new Date().getFullYear()) ? null : "Geçersiz yıl",
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
    const newVehicleValue = {
      ...values,
      plate: values.plate.toUpperCase(),
      userId: currentUser?.id as number,
      mileage: (values.mileage ? parseInt(values.mileage): undefined),
      year: values.year ? parseInt(values.year) : null
    }

    const result = await service.addVehicle(newVehicleValue);

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
  const openDialog = (values: GetVehicleData[]) => {

    if (values?.length > 0) {
      form.reset();
      setStockData(values);
      open();

    }
  }
  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Araç Ekle"
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
            <Grid.Col span={6}>
              <TextInput
                label="Plaka Numarası"
                placeholder="plaka giriniz"
                required
                {...form.getInputProps('plate')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Marka"
                placeholder="marka giriniz"
                required
                {...form.getInputProps('brand')}
              />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Model"
              placeholder="model giriniz"
              required
              {...form.getInputProps('model')}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Yıl"
              placeholder="yıl giriniz"
              type='number'
              min={1900}
              {...form.getInputProps('year')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Konum Yeri"
              placeholder="yeri giriniz" required
              {...form.getInputProps('place')}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Renk"
              placeholder="renk giriniz"
              {...form.getInputProps('color')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Motor Numarası"
              placeholder="motor numarası giriniz"
              {...form.getInputProps('engineNumber')}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Kilometresi"
              placeholder="kilometre giriniz"
              type='number'
              min={10}
              {...form.getInputProps('mileage')}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Yakıt Tipi"
              placeholder="yakıt Seçiniz"
              data={mockDataFuelTypes.map(item => ({ value: item.id, label: item.name }))}
              searchable clearable required maxDropdownHeight={200}
              nothingFoundMessage="yakıt bulunamadı..."
              onChange={(value) => form.setFieldValue('fuelType', value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Vites Tipi"
              placeholder="vites Seçiniz"
              data={mockDataTransmissionTypes.map(item => ({ value: item.id, label: item.name }))}
              searchable clearable required maxDropdownHeight={200}
              nothingFoundMessage="vites bulunamadı..."
              onChange={(value) => form.setFieldValue('transmission', value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Yakıt Durumu"
              placeholder="Yakıt durumu Seçiniz"
              data={mockDataFuelLevel.map(item => ({ value: item.id, label: item.name }))}
              searchable clearable required maxDropdownHeight={200}
              nothingFoundMessage="Yakıt durumu bulunamadı..."
              onChange={(value) => form.setFieldValue('fuelLevel', value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Sigorta Tarihi" placeholder="sigorta tarihi" clearable renderDay={DayRenderer}
              minDate={new Date()} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('insuranceDate', value)} locale="tr"
            />
           </Grid.Col>
           <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Muane Tarihi" placeholder="muane tarihi" clearable renderDay={DayRenderer}
              minDate={new Date()} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('inspectionDate', value)} locale="tr"
            />
           </Grid.Col>
           <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Kasko Tarihi" placeholder="kasko tarihi" clearable renderDay={DayRenderer}
              minDate={new Date()} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              onChange={(value) => form.setFieldValue('kaskoDate', value)} locale="tr"
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

export default VehicleAdd;
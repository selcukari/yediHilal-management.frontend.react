import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { last } from 'ramda';
import { subDays } from 'date-fns';
import { DateInput } from '@mantine/dates';
import { Modal, TextInput, Button, Stack, Textarea, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useUserService } from '../../services/userService';
import { useBranchService } from '../../services/branchService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '../../components';

export type BranchAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  branchName: string;
  provinceId: string;
  branchHeadId: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  rentalPrice?: number;
  leaseAgreementDate?: string | null;
  isRent: boolean;
  files?: any[];
};
type GetUserData = {
  id: string;
  fullName: string;
}

const BranchAdd = forwardRef<BranchAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [userData, setUserData] = useState<GetUserData[]>([]);
  const [branchHeadDutyId, setBranchHeadDutyIdDutyId] = useState<string>("19");
  
  const service = useBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      branchName: '',
      provinceId: "",
      branchHeadId: "",
      address:"",
      phone: "",
      email:"",
      leaseAgreementDate: "",
      socialMedias: "",
      openingDate: "",
      updateDate: "",
      createDate: "",
      rentalPrice: 1000,
      isRent: true,
      files: [],
    },
    validate: {
      branchName: (value) => (value.trim().length < 5 ? 'Temsilcilik Adı en az 5 karakter olmalı' : null),
      phone: (value) => {
        if (!value) return undefined;

        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Dosya form değerlerinden al
    const files = form.values.files || [];

    const result = await service.addBranch({
      ...values,
      files: files.length > 0 ? files : undefined,
      rentalPrice: values.isRent ? values.rentalPrice : undefined,
      branchName: values.branchName.trim(),
      leaseAgreementDate: values.isRent ? values.leaseAgreementDate : null,
      provinceId: values.provinceId as string,
      branchHeadId: values.branchHeadId as string,
    });

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
    else if (result?.data === false && result?.errors?.length > 0) {

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
  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

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

    fetchUsers();
    form.reset();

    open();
  }
  const fetchUsers = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
      }
      const getUsers: any[] | null = await serviceUser.users(params);
      
      if (getUsers) {
        const newUsers = getUsers.map(u => ({
          ...u,
          duties: u.duties ? last(JSON.parse(u.duties as string)) : { ids: "", names: "" }
        }));

        setUserData(newUsers.filter(u => u.duties?.ids?.includes(branchHeadDutyId))?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
      } else {
        toast.info('Hiçbir veri yok!');
        setUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };

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
      title="Yeni Temsilcilik Ekle"
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
                label="Temsilcilik Adı"
                placeholder="Temsilcilik adı giriniz"
                required
                {...form.getInputProps('branchName')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ProvinceSelect 
                form={form}
                required={true}
                label="İl" 
                placeholder="İl Seçiniz" 
                countryId={"1"}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Temsilcilik Başkanı" placeholder="temsilcilik başkan Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))}
                searchable clearable maxDropdownHeight={200} nothingFoundMessage="Temsilcilik başkan alan bulunamadı..."
                required onChange={(value) => form.setFieldValue('branchHeadId', value)}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Telefon"
                placeholder="505 555 5555"
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Email"
                placeholder="Email giriniz"
                type="email"
                {...form.getInputProps('email')}
              />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md" label="Sosyal Hesaplar" placeholder="hesaplar..."
              withAsterisk minRows={5}
              {...form.getInputProps('socialMedias')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md" label="Adres" placeholder="adres..."
              withAsterisk minRows={5}
              value={form.values.socialMedias}
              {...form.getInputProps('address')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
           <DateInput
             label="Açılış Tarihi" placeholder="açılış tarihi" clearable locale="tr" renderDay={DayRenderer}
             minDate={subDays(new Date(), 30)}  leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
             onChange={(value) => form.setFieldValue('openingDate', value)}
           />
          </Grid.Col>
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="flex-end"
            direction="row"
            wrap="wrap">
            <Grid.Col span={6}>
              <Switch
                label="Kiralık mı?" 
                checked={form.values.isRent}
                onChange={(event) => form.setFieldValue('isRent', event.currentTarget.checked)}
              />
            </Grid.Col>
          </Flex>
          <Grid.Col span={2}>
            <TextInput
              label="Kira Üçreti" placeholder="kira üçreti giriniz" type='number'
              disabled={!form.values.isRent} required={form.values.isRent}
              {...form.getInputProps('rentalPrice')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
           <DateInput
              label="Kira Sözleşme Tarihi" placeholder="tarih" clearable minDate={subDays(new Date(), 30)} locale="tr" renderDay={DayRenderer}
              value={form.values.leaseAgreementDate || undefined} leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              disabled={!form.values.isRent} required={form.values.isRent}
              onChange={(value) => form.setFieldValue('leaseAgreementDate', value)}
           />
          </Grid.Col>
          <Grid.Col span={6}>
            <FileUpload
              form={form}
              required={form.values.isRent}
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

export default BranchAdd;
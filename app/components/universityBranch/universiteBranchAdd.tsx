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
import { useUniversityBranchService } from '../../services/universityBranchService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '..';

export type UniversityBranchAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

interface UniversityBranchAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  universityName: string;
  provinceId: string;
  branchHeadId: string | null;
  socialMedias?: string | null;
  email?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  files?: any[];
};
type GetUserData = {
  id: string;
  fullName: string;
}

const UniversityBranchAdd = forwardRef<UniversityBranchAddDialogControllerRef, UniversityBranchAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [userData, setUserData] = useState<GetUserData[]>([]);
  const [branchHeadDutyId, setBranchHeadDutyIdDutyId] = useState<string>("9");
  
  const service = useUniversityBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      universityName: '',
      provinceId: "",
      branchHeadId: "",
      email:"",
      socialMedias: "",
      updateDate: "",
      createDate: "",
      files: [],
    },
    validate: {
      universityName: (value) => (value.trim().length < 5 ? 'Üniversite Adı en az 5 karakter olmalı' : null),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    // Dosya form değerlerinden al
    const files = form.values.files || [];

    const result = await service.addUniversityBranch({
      ...values,
      files: files.length > 0 ? files : undefined,
      universityName: values.universityName.trim(),
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
      title="Yeni Üniversite Ekle"
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
                label="Üniversite Adı"
                placeholder="Üniversite adı giriniz"
                required
                {...form.getInputProps('universityName')}
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
                label="Üniversite Başkanı" placeholder="Üniversite başkan Seçiniz"
                data={userData.map(item => ({ value: item.id, label: item.fullName }))}
                searchable clearable maxDropdownHeight={200} nothingFoundMessage="Temsilcilik başkan alan bulunamadı..."
                required onChange={(value) => form.setFieldValue('branchHeadId', value)}
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
            <FileUpload
              form={form}
              required={false}
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

export default UniversityBranchAdd;
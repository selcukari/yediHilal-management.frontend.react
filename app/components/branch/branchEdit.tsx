import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { last, clone, omit } from 'ramda';
import { DateInput } from '@mantine/dates';
import { Modal, TextInput, Button, Stack, Textarea, Title, Table, Paper, Grid, Flex, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { subDays } from 'date-fns';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useUserService } from '../../services/userService';
import { useBranchService } from '../../services/branchService';
import { toast } from '../../utils/toastMessages';
import { FileUpload } from '../fileInput';

export type BranchEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  branchName: string;
  provinceId: string | null;
  branchHeadId: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  rentalPrice?: number;
  isRent: boolean;
  isActive: boolean;
  files?: any[];
};
type GetUserData = {
  id: string;
  fullName: string;
  phone?: string;
  countryCode?: string;
}
interface TableHeader {
  field: keyof GetUserData;
  header: string;
}

const BranchEdit = forwardRef<BranchEditDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [branchHeadUserData, setBranchHeadUserData] = useState<GetUserData[]>([]);
  const [sancaktarUserData, setSancaktarUserData] = useState<GetUserData[]>([]);
  const [branchHeadDutyId, setBranchHeadDutyIdDutyId] = useState<string>("9");
  const [sancaktarDutyId, setSancaktarDutyId] = useState<string>("10");
  
  const service = useBranchService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      branchName: '',
      provinceId: "",
      branchHeadId: "",
      address:"",
      phone: "",
      email:"",
      socialMedias: "",
      openingDate: "",
      rentalPrice: 1000,
      isRent: true,
      isActive: true,
      files: []
    },
    validate: {
      branchName: (value) => (value.trim().length < 5 ? 'Şube Adı en az 5 karakter olmalı' : null),
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
    
    const result = await service.updateBranch({
      ...omit(['isActive', 'provinceId'], values),
      files: files.length > 0 ? files : undefined,
      branchName: values.branchName.trim(),
      isRent: values.isRent,
      rentalPrice: values.isRent ? values.rentalPrice : undefined,
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

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }
  const openDialog = (value: FormValues) => {
    if (value) {
      fetchUsers();
      form.setValues((value));

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et
      form.reset();

      open();
    }
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

        setBranchHeadUserData(newUsers.filter(u => u.duties?.ids?.includes(branchHeadDutyId))?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
        setSancaktarUserData(newUsers.filter(u => u.duties?.ids?.includes(sancaktarDutyId) && (u.hierarchy || "")?.toString() == (form.values.branchHeadId)?.toString())?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName, phone: i.phone, countryCode: i.countryCode })));
      } else {
        toast.info('Hiçbir veri yok!');
        setBranchHeadUserData([]);
        setSancaktarUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));
  const [rowSancaktarUserHeaders, setRowSancaktarUserHeaders] = useState<TableHeader[]>([
    { field: 'fullName', header: 'İsim' },
    { field: 'phone', header: 'Telefon' },
  ]);

  const rowsSancaktarUserTable = () => {
    return sancaktarUserData?.map((item) => (
      <Table.Tr key={item.id}>
        {rowSancaktarUserHeaders.map((header) => {
          if (header.field === 'phone') {
            return (
              <Table.Td key={header.field}>
                {`+${item["countryCode"]}${item["phone"]}`}
              </Table.Td>
            );
          }

          return (
            <Table.Td key={header.field}>
              {item[header.field] || '-'}
            </Table.Td>
          );
        })}
      </Table.Tr>
    ))
  };

  const fetchUsersForSancaktar = async () => {
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

        setSancaktarUserData(newUsers.filter(u => u.duties?.ids?.includes(sancaktarDutyId) && (u.hierarchy || "")?.toString() == (form.values.branchHeadId)?.toString())?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName, phone: i.phone, countryCode: i.countryCode })));
      } else {
        toast.info('Hiçbir veri yok!');
        setSancaktarUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchUsersForSancaktar();
    rowsSancaktarUserTable();
  }, [form.values.branchHeadId]);

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Şube Güncelle"
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
                label="Şube Adı" placeholder="şube adı giriniz" required
                value={form.values.branchName}
                {...form.getInputProps('branchName')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ProvinceSelect 
                form={form} required={true} label="İl" placeholder="İl Seçiniz" 
                countryId={"1"} disabled={true}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Şube Başkanı" placeholder="şube başkan Seçiniz" data={branchHeadUserData.map(item => ({ value: item.id, label: item.fullName }))}
                searchable clearable maxDropdownHeight={200} value={form.values.branchHeadId}
                nothingFoundMessage="şube başkan alan bulunamadı..." required
                onChange={(value) => form.setFieldValue('branchHeadId', value)}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Telefon" placeholder="505 555 5555"
                value={form.values.phone}
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Email" placeholder="Email giriniz" type="email"
                value={form.values.email}
                {...form.getInputProps('email')}
              />
          </Grid.Col>
          <Grid.Col span={6}>
            <Textarea
              mt="md" label="Sosyal Hesaplar" placeholder="hesaplar..."
              withAsterisk minRows={5}
              value={form.values.socialMedias}
              {...form.getInputProps('socialMedias')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
           <DateInput
              label="Açılış Tarihi" placeholder="açılış tarihi" clearable minDate={subDays(new Date(), 30)}
              value={form.values.openingDate}
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
              value={form.values.rentalPrice}
              {...form.getInputProps('rentalPrice')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <FileUpload
              form={form}
              required={false}
              />
          </Grid.Col>
          {/* dagişen sancaktar baskana baglı olanlar listesi */}
          {(rowsSancaktarUserTable())?.length > 0 &&
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="center"
            direction="row"
            wrap="wrap">
            <Grid.Col span={12}>
            <Paper shadow="xs" p="lg" withBorder>
              <Stack gap="md">
                <Title order={2}>Sancaktarlar</Title>
                <Table.ScrollContainer minWidth={500} maxHeight={700}>
                  <Table striped highlightOnHover withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        {rowSancaktarUserHeaders.map((header) => (
                          <Table.Th key={header.field}>{header.header}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rowsSancaktarUserTable()}</Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Stack>
            </Paper>
          </Grid.Col>
          </Flex>
          }
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

export default BranchEdit;
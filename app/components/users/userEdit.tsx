import { forwardRef, useEffect, useImperativeHandle, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit, last } from 'ramda';
import { Modal, TextInput, Paper, Title, Table, Flex, Button, Select, Stack, Grid, PasswordInput, Group, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { useUserService } from '../../services/userService';
import { RoleSelect } from '../addOrEdit/roleSelect';
import { toast } from '../../utils/toastMessages';
import { ModuleSelect } from '../addOrEdit/moduleSelect';
import { ResponsibleSelect } from '../addOrEdit/responsibleSelect';
import { areNumberSequencesEqual } from '../../utils/areNumberSequencesEqual';
import { DutySelect } from '../addOrEdit/dutySelect';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useAuth } from '~/authContext';
interface DutiesType {
  ids: string;
  names?: string;
  createDate: string;
  authorizedPersonId: number; // yetkili kişi tarafından atandı id
  authorizedPersonName: string; // yetkili kişi tarafından atandı name
}

interface TableHeader {
  field: keyof DutiesType;
  header: string;
}

export type UserEditDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void;
};

interface UserEditProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  id: number;
  fullName: string;
  identificationNumber: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  isActive: boolean;
  countryId: string;
  roleId: string;
  hierarchy?: string | null;
  moduleRoles: string;
  provinceId: string;
  createdDate?: string;
  password: string;
  updateDate?: string;
  responsibilities?: string;
  duties?: DutiesType[];
  dutiesIds?: string;
  deleteMessageTitle?: string;
};
type GetUserData = {
  id: string;
  fullName: string;
}

const UserEdit = forwardRef<UserEditDialogControllerRef, UserEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultDutyData, setresultDutyData] = useState<DutiesType[]>([]);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [userData, setUserData] = useState<GetUserData[]>([]);
  // Sadece sancaktar id tutmak için ve sube baskanının uyelerini eklemek icin
  const [sancaktarDutyId, setSancaktarDutyId] = useState<string>("10");
  const [branchHeadDutyId, setBranchHeadDutyIdDutyId] = useState<string>("9");
  
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    initialValues: {
      id: 0,
      fullName: '',
      identificationNumber: '',
      email: '',
      countryCode: '90',
      phone: '',
      dateOfBirth: '',
      countryId: '1',
      roleId: '3',
      provinceId: '',
      isActive: true,
      createdDate: "",
      updateDate: "",
      password: '',
      moduleRoles: '',
      responsibilities: '',
      hierarchy: '',
      duties: [],
      dutiesIds: '',
      deleteMessageTitle: '',
    },
    validate: {
      fullName: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      dutiesIds: (value) => ((value && value?.length >= 1) || isDisabledRoleComponent ? null : 'Görev en az 1 tane olmalı'),
      provinceId: (value) => (value ? null : 'İl alanı zorunlu'),
      password: (value) => (value.trim().length < 5 ? 'Şifre en az 5 karakter olmalı' : null),
      identificationNumber: (value) => {
        if (!value?.trim()) return null;
        // Sadece rakam kontrolü
        if (!/^[0-9]+$/.test(value)) return 'Sadece rakam girebilirsiniz';

        return null; // Geçerli
      },
      countryCode: (value) => {

        return /^[0-9]+$/.test(value) ? null : 'Geçersiz ülkekodu';
      },
      phone: (value) => {
        return /^[0-9]+$/.test(value) ? null : 'Sadece rakam girebilirsiniz';
      },
      dateOfBirth: (value) => {
        if (!value) return undefined;

        return /^[0-9]+$/.test(value.toString()) ? null : 'Sadece rakam girebilirsiniz';
      },
      deleteMessageTitle: (value) => {

        if (!form.values.isActive) {

          return value && value.trim().length > 5 ? null : 'Mesaj en az 5 karakter olmalı.';
        }

        return null;
      },
    },
  });

    const [rowDutyHeaders, setRowDutyHeaders] = useState<TableHeader[]>([
    { field: 'names', header: 'Görevi' },
    { field: 'createDate', header: 'Görev Atama Kayıt' },
    { field: 'authorizedPersonName', header: 'Atayan Kişi' },
  ]);

    const rowsDutyTable = resultDutyData?.map((item) => (
    <Table.Tr key={item.ids}>
      {rowDutyHeaders.map((header) => {
        if (header.field === 'authorizedPersonName') {
          return (
            <Table.Td key={header.field}>
              {item["authorizedPersonName"] && item["authorizedPersonName"]}
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
  ));

  const openDialog = (value: FormValues) => {

    if (value) {
      fetchUsers();
      setresultDutyData(value.duties as DutiesType[] || []);
      form.reset();
      // Önce initial values'ı set et
      form.setValues((value));

      form.setInitialValues((value));
      // Sonra form values'larını set et

      open();
    }
  }
  const fetchUsers = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
      }
      const getUsers: any[] | null = await service.users(params);
      
      if (getUsers) {
        const newUsers = getUsers.map(u => ({
          ...u,
          duties: u.duties ? last(JSON.parse(u.duties as string)) : { ids: "", names: "" }
        }));

        setUserData(newUsers.filter(u => u.duties?.ids?.includes(branchHeadDutyId) && u.id != form.values.id)?.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName })));
      } else {
        toast.info('Hiçbir veri yok!');
        setUserData([]);
      }
    } catch (error: any) {
      toast.error(`User yüklenirken hata: ${error.message}`);
    }
  };

  const isDisabledRoleComponent = useMemo(() => {
    return currentUser?.roleId != 1; // admin roleId
  }, [currentUser?.roleId]);

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);

    const isChangeDuty = areNumberSequencesEqual(values.dutiesIds,
      resultDutyData[resultDutyData?.length -1]?.ids)

    // Yeni görev verisi
    const newDuty = {
      ids: values.dutiesIds?.toString() ?? "",
      authorizedPersonId: currentUser?.id,
      authorizedPersonName: currentUser?.fullName,
      createDate: formatDate(new Date().toISOString(), dateFormatStrings.dateTimeFormatWithoutSecond)
    };

    // Eğer görev değişmişse, yeni görevi ekle
    if (!isChangeDuty) {
      resultDutyData.push(newDuty);
    }

    const newUserValue = {
      ...omit(['createdDate', 'updateDate', 'dutiesIds'], values),
      deleteMessageTitle: (values.isActive ? undefined : (values.deleteMessageTitle ? values.deleteMessageTitle.trim() : undefined )),
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      roleId: values.roleId ? parseInt(values.roleId) : undefined,
      duties: resultDutyData ? JSON.stringify(resultDutyData) : undefined,
      hierarchy: (values.dutiesIds?.toString() || "")?.includes(sancaktarDutyId) && values.hierarchy ? parseInt(values.hierarchy) : undefined,
    }

    const result = await service.updateUser(newUserValue);

    if (result == true) {

      toast.success('İşlem başarılı!');
      
      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      form.reset();
      
      close();
      setIsDisabledSubmit(false);

      return;
    }
    if (result?.data == false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    setIsDisabledSubmit(false);
  };

   // Ülke değiştiğinde ili sıfırla
  useEffect(() => {
    if (form.values.countryId != form.getInitialValues().countryId) {
      // Ülke değiştiğinde ili resetle
      form.setFieldValue('provinceId', "");
    }
  }, [form.values.countryId]);

  const confirmDialogHandleConfirm = () => {
    // Silme işlemini burada yapın
    confirmModalRef.current?.close();
    form.reset();
    close();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {

      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      form.reset();
      close();
    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

  const isDisabledBranchHead = useMemo(() => {
    if (form.values.dutiesIds?.includes(sancaktarDutyId)) {
      return !isDisabledRoleComponent;
    }
    return false;
  },[form.values.dutiesIds]);

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Kullanıcı Düzenle"
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
                label="Ad Soyad"
                placeholder="İsim giriniz"
                value={form.values.fullName}
                required
                {...form.getInputProps('fullName')}
              />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Kimlik"
              value={form.values.identificationNumber}
              placeholder="Kimlik numarası giriniz"
              {...form.getInputProps('identificationNumber')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <CountrySelect
              form={form}
              disabled={true}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <ProvinceSelect 
              form={form}
              required={true}
              label="İl" 
              placeholder="İl Seçiniz"
              countryId={form.values.countryId}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <TextInput
              label="Ülke Kodu"
              placeholder="Ülke kodu giriniz"
              value={form.values.countryCode}
              required
              {...form.getInputProps('countryCode')}
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <TextInput
              label="Telefon"
              placeholder="505 555 5555"
              value={form.values.phone}
              required
              {...form.getInputProps('phone')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Doğum Tarih(Yıl)"
              placeholder="Doğum Tarihini giriniz(yıl)"
              value={form.values.dateOfBirth}
              {...form.getInputProps('dateOfBirth')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Email"
              placeholder="Email giriniz"
              required
              value={form.values.email}
              {...form.getInputProps('email')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <PasswordInput
              label="Şifre"
              placeholder="Şifre giriniz"
              required
              {...form.getInputProps('password')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <RoleSelect 
              form={form}
              isDisabled={isDisabledRoleComponent}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DutySelect
              form={form}
              required={isDisabledRoleComponent}
              isDisabled={isDisabledRoleComponent}
              {...form.getInputProps('dutiesIds')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Bağlı old. Şube Başkanı"
              placeholder="şube başkan Seçiniz"
              data={userData.map(item => ({ value: item.id, label: item.fullName }))}
              searchable clearable maxDropdownHeight={200}
              nothingFoundMessage="şube başkan alan bulunamadı..."
              value={form.values.hierarchy}
              disabled={!isDisabledBranchHead} required={isDisabledBranchHead}
              onChange={(value) => form.setFieldValue('hierarchy', value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <ModuleSelect
              form={form}
              isDisabled={isDisabledRoleComponent}
              {...form.getInputProps('moduleRoles')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <ResponsibleSelect
              form={form}
              isDisabled={isDisabledRoleComponent}
              {...form.getInputProps('responsibilities')}
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
                label="Kullanıcı Durumu" 
                checked={form.values.isActive}
                onChange={(event) => form.setFieldValue('isActive', event.currentTarget.checked)}
              />
            </Grid.Col>
          </Flex>

          <Grid.Col span={6}>
            <Textarea
              mt="md"
              label="Silme nedeni"
              placeholder="messaj..."
              withAsterisk
              disabled={form.values.isActive}
              {...form.getInputProps('deleteMessageTitle')}
            />
          </Grid.Col>
          {/* dagişen duty(görev) listesi */}
          {rowsDutyTable?.length > 0 &&
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
                <Title order={2}>Son Görevler</Title>
                <Table.ScrollContainer minWidth={500} maxHeight={700}>
                  <Table striped highlightOnHover withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        {rowDutyHeaders.map((header) => (
                          <Table.Th key={header.field}>{header.header}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rowsDutyTable}</Table.Tbody>
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
            <Button type="submit" variant="filled" disabled={isDisabledSubmit} size="xs"  leftSection={<IconCheck size={14} />} radius="xs">
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

export default UserEdit;
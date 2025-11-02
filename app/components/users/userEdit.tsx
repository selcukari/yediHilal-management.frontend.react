import { forwardRef, useEffect, useImperativeHandle, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit, last, clone } from 'ramda';
import { Modal, TextInput, Paper, Title, Table, Flex, Button, Select, Stack, Grid, PasswordInput, Group, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { CountrySelect } from '../addOrEdit/countrySelect';
import { ProvinceSelect } from '../addOrEdit/provinceSelect';
import { DistrictceSelect } from '../addOrEdit/districtSelect';
import { useUserService } from '../../services/userService';
import { RoleSelect } from '../addOrEdit/roleSelect';
import { toast } from '../../utils/toastMessages';
import { ModuleSelect } from '../addOrEdit/moduleSelect';
import { areNumberSequencesEqual } from '../../utils/areNumberSequencesEqual';
import { UserDutySelect } from '../addOrEdit/userDutySelect';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { useAuth } from '~/authContext';
import { MenuActionButton } from '../../components'
import { type ColumnDefinition, type ValueData } from '../../utils/repor/exportToExcel';
import { type PdfTableColumn } from '../../utils/repor/exportToPdf';
import { calculateColumnWidthMember } from '../../utils/repor/calculateColumnWidth';
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
  moduleRoles: string;
  provinceId: string;
  districtId?: string;
  createdDate?: string;
  password: string;
  updateDate?: string;
  duties?: DutiesType[];
  dutiesIds?: string;
  dutyIds?: string;
  deleteMessageTitle?: string;
};

const UserEdit = forwardRef<UserEditDialogControllerRef, UserEditProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultDutyData, setresultDutyData] = useState<DutiesType[]>([]);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  
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
      districtId: '',
      isActive: true,
      createdDate: "",
      updateDate: "",
      password: '',
      moduleRoles: '',
      duties: [],
      dutiesIds: '',
      dutyIds: '',
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

  const rowsDutyTable = resultDutyData?.map((item, index) => (
    <Table.Tr key={index}>
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
      setresultDutyData(value.duties as DutiesType[] || []);
      form.reset();
      // Önce initial values'ı set et
      form.setValues((value));

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et

      open();
    }
  }

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
      fullName: values.fullName.trim(),
      provinceId: values.provinceId ? parseInt(values.provinceId) : undefined,
      districtId: values.districtId ? parseInt(values.districtId) : undefined,
      countryId: values.countryId ? parseInt(values.countryId) : undefined,
      roleId: values.roleId ? parseInt(values.roleId) : undefined,
      duties: resultDutyData ? JSON.stringify(resultDutyData) : undefined,
      dutyIds: values.dutiesIds ? values.dutiesIds.toString() : '',
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

   // useMemo hook'u ile sütunları önbelleğe alıyoruz
  const pdfTableColumns = useMemo((): PdfTableColumn[] => {
    const newCols: TableHeader[] = rowDutyHeaders;
    return newCols.map(col => ({
      key: col.field,
      title: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
      width: calculateColumnWidthMember(col.field) // Özel genişlik hesaplama fonksiyonu
    }));
  }, [rowDutyHeaders]);

  const excelTableColumns = useMemo((): ColumnDefinition[] => {
    const newCols: TableHeader[] = rowDutyHeaders;
    return newCols.map(col => ({
      key: col.field as keyof ValueData,
      header: col.header,
      // İsteğe bağlı olarak genişlik ayarları ekleyebilirsiniz
    }));
  }, [rowDutyHeaders]);
  const reportTitle = (): string => {
    return `${form.values.fullName } kullanıcı Geçmiş Görev Raporu`; 
  }

  // raportdata
  const raportProjectData = useMemo(() => {
    return resultDutyData.map((dutiesType: DutiesType) => ({
      ...dutiesType,
      authorizedPersonName: dutiesType.authorizedPersonName ?
        `${dutiesType.authorizedPersonName}-${form.values.countryCode}${form.values.phone}` : "",
    }))
  }, [resultDutyData])
  
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

          <Grid.Col span={4}>
            <CountrySelect
              form={form}
              disabled={true}
            />
          </Grid.Col>

          <Grid.Col span={4}>
            <ProvinceSelect 
              form={form}
              required={true}
              label="İl" 
              placeholder="İl Seçiniz"
              countryId={form.values.countryId}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <DistrictceSelect 
              form={form}
              required={true}
              provinceId={form.values.provinceId}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Ülke Kodu"
              placeholder="Ülke kodu giriniz"
              value={form.values.countryCode}
              required type='number'
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
              label="Doğum Tarih"
              placeholder="yıl giriniz(2000)"
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
            <UserDutySelect
              form={form}
              required={isDisabledRoleComponent}
              isDisabled={isDisabledRoleComponent}
              {...form.getInputProps('dutiesIds')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <ModuleSelect
              form={form}
              isDisabled={isDisabledRoleComponent}
              {...form.getInputProps('moduleRoles')}
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
          {rowsDutyTable?.length > 0 &&
          <Grid.Col span={{ base: 12, sm: 6, md: 4}}>
            <Flex
            mih={50}
            gap="md"
            justify="flex-end"
            align="flex-end"
            direction="row"
            wrap="wrap"
          >
            <MenuActionButton
            reportTitle={reportTitle()}
            excelColumns={excelTableColumns}
            valueData={raportProjectData}
            pdfColumns={pdfTableColumns}
            type={2}
            isMailDisabled={true}
            isSmsDisabled={true}
            isWhatsAppDisabled={true}
            />
          </Flex>
          </Grid.Col>
          }
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
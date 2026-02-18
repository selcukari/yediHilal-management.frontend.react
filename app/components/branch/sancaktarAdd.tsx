import { forwardRef, useImperativeHandle, useEffect, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Select, Button, Stack, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMemberService } from '../../services/memberService';
import { useUserDutyService } from '../../services/userDutyService';
import { toast } from '../../utils/toastMessages';

export type SancaktarAddDialogControllerRef = {
  openDialog: (ids?: string[] | null) => void;
  close: () => void;
};

type SancaktarDataGorevatama = {
  memberId: string;
  memberFullName: string;
  memberPhone?: string | null;
  userDutyName: string;
  userDutyId: string;
  isActive: string;
  newItem: boolean;
  createDate: string;
  finisDate: string;
}

interface SancaktarAddProps { 
  onSaveSuccess?: (data: SancaktarDataGorevatama) => void; // Yeni prop
}

type FormValues = {
  userDutyId: string;
  memberId: string | null;
};

type GetSancaktarData = {
  id: string;
  fullName: string;
  phone: string;
}

const SancaktarAdd = forwardRef<SancaktarAddDialogControllerRef, SancaktarAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [sancaktarData, setSancaktarData] = useState<GetSancaktarData[]>([]);
  const [sancaktarDataIds, setSancaktarDataIds] = useState<string[] | null>(null);
  const [userDuty, setUserDuty] = useState<any>(null);
  const [userDutyData, setUserDutyData] = useState<any[]>([])
  
  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const serviceBranchDuty =  useUserDutyService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      userDutyId: '',
      memberId: ""
    },
    validate: {
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);

    const memberFind = sancaktarData.find(i => i.id == values.memberId);

      // onSaveSuccess event'ini tetikle
      if (onSaveSuccess) {
        onSaveSuccess({
          memberId: values.memberId ?? "",
          memberFullName: memberFind?.fullName ?? "",
          memberPhone: memberFind?.phone,
          userDutyName: (userDuty.name || ""),
          userDutyId: (userDuty.id || ""),
          createDate: new Date().toISOString(),
          finisDate: '',
          isActive: "1",
          newItem: true
        });

      toast.success('Üye Eklendi!');
      }
      
      close();
      form.reset();
      setIsDisabledSubmit(false);

      return;
    };

  useEffect(() => {
    if (form.isDirty()) {

      setIsDisabledSubmit(false);
      return;
    }

    setIsDisabledSubmit(true);
  }, [form.values]);

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

  const fetchMembers = async () => {
    try {
      const params = {
        countryId: "1",
        isActive: true,
        typeIds: "10" // "görevli" üye tipindekiler gelsin "membertypes"
      }
  
      const getMembers = await service.members(params);
      
      if (getMembers) {
        setSancaktarData(getMembers.map((i: any) => ({ id: i.id.toString(), fullName: i.fullName, phone: i.phone ?? "" })));
      } else {
        toast.info('Hiçbir veri yok!');
        setSancaktarData([]);
      }
    } catch (error: any) {
      toast.error(`üyeler yüklenirken hata: ${error.message}`);
    }
  };
  const fetchBranchDutys = async () => {
    try {
      
      const getBranchDuties = await serviceBranchDuty.getUserDuties();
      
      if (getBranchDuties) {
        setUserDutyData(getBranchDuties);
      } else {
        toast.info('Hiçbir veri yok!');
        setUserDutyData([]);
      }
    } catch (error: any) {
      toast.error(`getBranchDuties yüklenirken hata: ${error.message}`);
    }
  };

  const openDialog = (ids?: string[] | null) => {
    fetchMembers();
    fetchBranchDutys();
    setSancaktarDataIds(ids ?? null);
    form.reset();

    open();
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));
  
  const sancaktarDataReview = useMemo(() => {
    return sancaktarData.map(item => ({
    value: item.id,
    label: item.fullName,
    disabled: sancaktarDataIds?.includes(item.id) ?? false
  }));
  }, [sancaktarData]);

  const handleChangeDuty = (value: string | null) => {
    if (value) {

      const getDuty = userDutyData?.find(i => i.id.toString() == value);

      if (getDuty){
        setUserDuty(getDuty)
      }

    }
  }

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Üye Ekle"
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
                <Select
                  label="Üye Ekle " placeholder="üye Seçiniz"
                  data={sancaktarDataReview}
                  searchable clearable maxDropdownHeight={200} nothingFoundMessage="üye bulunamadı..."
                  required onChange={(value) => form.setFieldValue('memberId', value)}
                />
              </Grid.Col>
            <Grid.Col span={6} offset={3}>
              <Select
                label="Görev Adı"
                placeholder="görev seçiniz"
                data={userDutyData.map(item => ({ value: item.id?.toString(), label: item.name }))}
                searchable clearable maxDropdownHeight={200} required
                nothingFoundMessage="görev bulunamadı..."
                onChange={handleChangeDuty}
              />

            </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
              Ekle
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

export default SancaktarAdd;
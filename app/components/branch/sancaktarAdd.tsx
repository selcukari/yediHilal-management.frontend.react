import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Select, Button, Stack, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMemberService } from '../../services/memberService';
import { toast } from '../../utils/toastMessages';

export type SancaktarAddDialogControllerRef = {
  openDialog: () => void;
  close: () => void;
};

type SancaktarDataGorevatama = {
  memberId: string;
  memberFullName: string;
  memberPhone?: string | null;
  branchDuty: string;
  isActive: string;
}

interface SancaktarAddProps { 
  onSaveSuccess?: (data: SancaktarDataGorevatama) => void; // Yeni prop
}

type FormValues = {
  branchDuty: string;
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
  
  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      branchDuty: '',
      memberId: ""
    },
    validate: {
      branchDuty: (value) => (value.trim().length < 5 ? 'Görev Adı en az 5 karakter olmalı' : null),
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
          branchDuty: values.branchDuty.trim(),
          isActive: "1"
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

  const openDialog = () => {
    fetchMembers();
    form.reset();

    open();
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
                  label="Üy Ekle " placeholder="üye Seçiniz"
                  data={sancaktarData.map(item => ({ value: item.id, label: item.fullName }))}
                  searchable clearable maxDropdownHeight={200} nothingFoundMessage="üye bulunamadı..."
                  required onChange={(value) => form.setFieldValue('memberId', value)}
                />
              </Grid.Col>
            <Grid.Col span={6} offset={3}>
              <TextInput
                label="Görev Adı"
                placeholder="görev giriniz"
                required
                {...form.getInputProps('branchDuty')}
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
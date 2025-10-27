import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { clone } from 'ramda';
import {  Modal,  Select,  Button,  Stack,  Grid,  TextInput,
} from '@mantine/core';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMemberService } from '../../services/memberService';
import { usePhoneCallTrackingService } from '../../services/phoneCallTrackingService';
import { toast } from '../../utils/toastMessages';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { formatDate } from '../../utils/formatDate';

export type PhoneCallStatuDialogControllerRef = {
  openDialog: (value: FormValues) => void;
  close: () => void; 
};

interface PhoneCallStatuProps {
  onSaveSuccess?: (value: FormValues) => void; // Yeni prop
}

type FormValues = {
id: number;
phoneCallStatudescription?: string;
};

const PhoneCallStatu = forwardRef<PhoneCallStatuDialogControllerRef, PhoneCallStatuProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultData, setResultData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);

  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
     initialValues: {
        id: 0,
        phoneCallStatudescription: '',
     },
     validate: {
        phoneCallStatudescription: (value) => (value && value.trim().length < 5 ? 'Arama durumu en az 5 karakter olmalı' : null),
     },
   });




  const handleSubmit = async (value: FormValues) => {
    setIsDisabledSubmit(true);

    if (onSaveSuccess) {
      onSaveSuccess(value);
    }
    form.reset();
    toast.success('İşlem başarılı!');
    
    close();
    setIsDisabledSubmit(false);

    return;
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
  };

  const confirmDialogHandleCancel = () => {
    toast.info("İşlem iptal edildi");
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

  useEffect(() => {
    if (form.isDirty()) {
      setIsDisabledSubmit(false);
       return;
    }
     setIsDisabledSubmit(true);
  }, [form.values]);

const openDialog = (value: FormValues) => {

    if (value) {
      form.reset();
      // Önce initial values'ı set et
      form.setValues(value);

      form.setInitialValues(clone(value));
      // Sonra form values'larını set et

      open();

    }
  }

  useImperativeHandle(ref, () => ({
    openDialog,
    close,
  }));

  return (
    <>
      <Modal
        opened={opened}
        onClose={dialogClose}
        title="Arama Durumu"
        centered
        size="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6} offset={3}>
                  <TextInput
                    label="Arama notu"
                    placeholder="notu giriniz"
                    value={form.values.phoneCallStatudescription}
                    required
                    {...form.getInputProps('phoneCallStatudescription')}
                  />
              </Grid.Col>
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
        </Stack>
      </Modal>
      
      {/* Confirm Dialog */}
      <ConfirmModal 
        ref={confirmModalRef}
        onConfirm={confirmDialogHandleConfirm}
        onCancel={confirmDialogHandleCancel}
      />
    </>
  );
});

export default PhoneCallStatu;
import { forwardRef, useImperativeHandle, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { omit } from 'ramda';
import { Modal, Textarea, Button, Stack, Grid, LoadingOverlay, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useSmsService } from '../../services/smsService';
import { toast } from '../../utils/toastMessages';

export type SmsSendDialogControllerRef = {
  openDialog: (value: ValueParams) => void;
  close: () => void;
};

interface PhoneNumbersWithCountryCode {
  telephone: string;
  countryCode: string;
}
type ValueParams = {
  toUsers: Array<string>;
  toPhoneNumbers: Array<string>;
  toCountryCodes: Array<string>;
  type: number;
  count: number;
}

type FormValues = {
  message: string;
};

const SmsSend = forwardRef<SmsSendDialogControllerRef, unknown>((_props, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [visibleLoading, openLoading] = useDisclosure(false);
  const [valueParams, setValueParams] = useState<ValueParams>({ toUsers: [], toPhoneNumbers: [], toCountryCodes: [], type: 2, count: 0 });

  const service = useSmsService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      message: "",
    },
    validate: {
      message: (value) => (value.trim().length < 10 ? 'Mesaj en az 10 karakter olmalı' : null),
    },
  });

  const isDisabledSelect = useMemo(() => {
    return !form.isValid();
  }, [form.values]);

   const openDialog = (value: ValueParams) => {

    if (value) {
      form.reset();
      // Önce initial values'ı set et
      setValueParams(value);

      open();
    }
  }

  const handleSubmit = async (values: FormValues) => {
    // Burada API çağrısı yapabilirsiniz
    openLoading.open();

    const newValue = {
      ...values,
      ...omit(['toPhoneNumbers', 'toCountryCodes'], valueParams),
      toPhoneNumbersWithCountryCode: valueParams.toPhoneNumbers.map((phone, index) => ({
        telephone: phone,
        countryCode: valueParams.toCountryCodes[index] || ""
      }))
    }
    const result = await service.sendSms(newValue);

    if (result === true) {

      toast.success('İşlem başarılı!');
      
      form.reset();
      
      close();
      openLoading.close();

      return;
    }
    if (result?.data === false && result?.errors) {

      toast.warning(result.errors[0]);

    } else {
      toast.error('Bir hata oluştu!');
    }
    openLoading.close();
  };

  const confirmDialogHandleConfirm = () => {
    // Silme işlemini burada yapın
    confirmModalRef.current?.close();
    form.reset();
    close();
  };

  const confirmDialogHandleCancel = () => {
    toast.info('İşlem iptal edildi');
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

  return (<>
    <LoadingOverlay
      visible={visibleLoading}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ color: 'pink', type: 'bars' }}
    />
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Mesaj Gönder"
      centered
      size="600"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md" align="stretch" justify="center">
          <Grid columns={6} justify="center">
            <Grid.Col span={5}>
              <Textarea mt="md" withAsterisk
                label="Mesaj"
                placeholder="Mesaj giriniz"
                required autosize minRows={10} maxRows={15}
                {...form.getInputProps('message')}
              />
          </Grid.Col>

          <Grid.Col span={6} style={{ textAlign: 'center' }}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" disabled={isDisabledSelect} size="xs"  leftSection={<IconCheck size={14} />} radius="xs">
              Göder
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

export default SmsSend;
import { forwardRef, useImperativeHandle, useState, useRef, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, LoadingOverlay, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMailService } from '../../services/mailService';
import { RichTextEditorTiptap } from '../richTextEditorTiptap';
import { toast } from '../../utils/toastMessages';

export type MailSendDialogControllerRef = {
  openDialog: (value: ValueParams) => void;
  close: () => void;
};

type ValueParams = {
  toUsers: Array<string>;
  toEmails: Array<string>;
  type: number;
  count: number;
}

type FormValues = {
  subject: string;
  body: string;
};

const MailSend = forwardRef<MailSendDialogControllerRef, unknown>((_props, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [visibleLoading, openLoading] = useDisclosure(false);
  const [valueParams, setValueParams] = useState<ValueParams>({ toUsers: [], toEmails: [], type: 2, count: 0 });

  const service = useMailService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      subject: "",
      body: "",
    },
    validate: {
      subject: (value) => (value.trim().length < 5 ? 'İsim en az 5 karakter olmalı' : null),
      body: (value) => {
        const textContent = value.replace(/<[^>]*>/g, '').trim();

        return textContent.length < 10 ? 'Adres en az 10 karakter olmalı' : null;
      }
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
      ...valueParams,
    }
    const result = await service.sendMail(newValue);

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
      title="Mail Gönder"
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
              <TextInput
                label="Konu"
                placeholder="Konu giriniz"
                value={form.values.subject}
                required
                {...form.getInputProps('subject')}
              />
          </Grid.Col>

          <Grid.Col span={5}>
            <Text>İçerik <span style={{ color: 'red' }}>*</span></Text>
            <RichTextEditorTiptap
              form={form}
              required={true}
              {...form.getInputProps('body')}
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

export default MailSend;
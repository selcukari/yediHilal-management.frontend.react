import { forwardRef, useImperativeHandle } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export type ConfirmModalRef = {
  open: () => void;
  close: () => void;
};

interface ConfirmModalProps {
  headerTitle?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ConfirmModal = forwardRef<ConfirmModalRef, ConfirmModalProps>(({
  headerTitle = "Dikkat!",
  message = "Yaptığınız değişiklikler iptal olacaktır. Devam etmek istiyor musunuz?",
  confirmText = "Evet",
  cancelText = "Hayır",
  onConfirm,
  onCancel
}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  const handleCancel = () => {
    onCancel?.();
    close();
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={headerTitle}
      centered
    >
      {message}
      <Group mt="lg" justify="flex-end">
        <Button onClick={handleCancel} variant="default">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color="red">
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
});

export default ConfirmModal;
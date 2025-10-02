import { forwardRef, useImperativeHandle } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCircleCheckFilled } from '@tabler/icons-react';

export type ApprovedConfirmModalRef = {
  open: () => void;
  close: () => void;
};

interface ConfirmModalProps {
  headerTitle?: string;
  message?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const ApprovedConfirmModal = forwardRef<ApprovedConfirmModalRef, ConfirmModalProps>(({
  headerTitle = "Başarılı!",
  message = "Kayıt başarıyla tamamlandı.",
  confirmText = "Tamam",
  onConfirm,
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

  const modalTitle =(
    <Group gap="xs">
      <IconCircleCheckFilled color="green" size={30} />
      <Text>{headerTitle}</Text>
    </Group>
  );

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={modalTitle}
      transitionProps={{ transition: 'rotate-left' }}
      centered
    >
      {message}
      <Group mt="lg" justify="center">
        <Button onClick={handleConfirm} color="green">
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
});

export default ApprovedConfirmModal;
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Button, Group, Modal, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export type ConfirmModalMessageRef = {
  open: () => void;
  close: () => void;
  getMessage: () => string;
};

interface ConfirmModalMessageProps {
  headerTitle?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (messageText: string) => void;
  onCancel?: () => void;
}

const ConfirmModalMessage = forwardRef<ConfirmModalMessageRef, ConfirmModalMessageProps>(({
  headerTitle = "Dikkat!",
  message = "Silmek istediğinizin nedeni?",
  confirmText = "Evet",
  cancelText = "Hayır",
  onConfirm,
  onCancel
}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [error, setError] = useState<string | null>('Mesaj alanı gereklidir.');
  const [messageText, setMessageText] = useState<string>('');

  const getMessage = () => messageText;

  useImperativeHandle(ref, () => ({
    open,
    close,
    getMessage,
  }));

  const handleConfirm = () => {
    onConfirm?.(messageText);
    close();
    setMessageText('');
  };

  const handleCancel = () => {
    onCancel?.();
    close();
    setMessageText('');
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={headerTitle}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      {message}
      <Textarea
        mt="md"
        label="Silme nedeni"
        placeholder="messaj..."
        withAsterisk
        error={error}
        required
        value={messageText}
        onChange={(event) => {
          const value = event.currentTarget.value;
          setMessageText(value);
          setError(value.trim()?.length > 5 ? null : 'En az 5 karakter gereklidir.');
        }}
      />
      <Group mt="lg" justify="flex-end">
        <Button onClick={handleCancel} variant="default">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color="red" disabled={!!error}>
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
});

export default ConfirmModalMessage;
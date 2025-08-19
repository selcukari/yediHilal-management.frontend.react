import { forwardRef, useImperativeHandle } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal } from '@mantine/core';

export type DialogControllerRef = {
  open: () => void;
  close: () => void;
};

const MemberAdd = forwardRef<DialogControllerRef>((_, ref) => {
  const [opened, { open, close }] = useDisclosure(false);

  // parent'tan erişilebilecek fonksiyonları expose ediyoruz
  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (
    <Modal opened={opened} onClose={close} title="Authentication" centered>
    </Modal>
  );
});

export default MemberAdd;

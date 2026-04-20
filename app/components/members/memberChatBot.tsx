import { useState } from 'react';
import { Affix, Button, Transition, Paper, Text, TextInput, Stack, ActionIcon, ScrollArea, Group } from '@mantine/core';
import { IconMessageChatbot, IconX, IconSend } from '@tabler/icons-react';
import { toast } from '../../utils/toastMessages';
import { useMemberService } from '~/services/memberService';

export function MemberChatBotAi({onSaveSuccess}: {onSaveSuccess?: () => void}) {
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  

  const handleSendMessage = async () => {
    if (!value.trim()) return;
    
    setLoading(true);
    try {
      const result = await service.addMemberByAi({ memberText: value });

      if (result == true) {
        toast.success('Yapay zeka bilgileri ayrıştırdı ve üye eklendi!');
        setValue('');
        setOpened(false);
        // onSaveSuccess event'ini tetikle
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
      if (result?.data == false && result?.errors?.length > 0) {

      toast.warning(result.errors[0]);

    } else {
        toast.error('Bilgiler tam anlaşılamadı, lütfen daha net yazınız.');
      }
    } catch (error) {
      toast.error('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={!opened}>
          {(transitionStyles) => (
            <Button
              leftSection={<IconMessageChatbot size={20} />}
              style={transitionStyles}
              onClick={() => setOpened(true)}
              color="pink"
              radius="xl"
              size="lg"
            >
              AI ile Üye Ekle
            </Button>
          )}
        </Transition>
      </Affix>

      <Affix position={{ bottom: 20, right: 20 }} zIndex={1001}>
        <Transition transition="scale-y" mounted={opened}>
          {(transitionStyles) => (
            <Paper
              withBorder
              shadow="xl"
              p="md"
              radius="md"
              style={{ ...transitionStyles, width: 350, height: 250 }}
            >
              <Stack justify="space-between" h="100%">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Yapay Zeka Asistanı</Text>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setOpened(false)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
                
                <Text size="xs" c="dimmed">
                  Örn: "Adı Mehmet Can, kimlik 123, il İstanbul, doğum tarihi 2005, telefonu 505111, email ornek@example.com olan yeni bir üye kaydet." şeklinde bilgileri yazabilirsiniz.
                </Text>

                <TextInput
                  placeholder="Üye bilgilerini buraya yazın..."
                  value={value}
                  onChange={(event) => setValue(event.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  rightSection={
                    <ActionIcon 
                      loading={loading} 
                      onClick={handleSendMessage} 
                      color="pink" 
                      variant="filled"
                    >
                      <IconSend size={16} />
                    </ActionIcon>
                  }
                />
              </Stack>
            </Paper>
          )}
        </Transition>
      </Affix>
    </>
  );
}
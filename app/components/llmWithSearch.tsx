import { useState } from 'react';
import { Affix, Button, Transition, Paper, Text, TextInput, Stack, ActionIcon, ScrollArea, Group, Box, Avatar } from '@mantine/core';
import { IconMessageChatbot, IconX, IconSend, IconFilter, IconRobot, IconUser } from '@tabler/icons-react';
import { toast } from '../utils/toastMessages';
import { useLlmService } from '~/services/llmService';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function MemberChatBotFilterAi({ onFilterApply }: { onFilterApply: (data: any[]) => void }) {
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Merhaba! "Ankara ve İstanbul\'daki aktif üyeleri getir" veya "Mersin\'de burs alan üyeleri filtrele" gibi aramak istediğiniz kriterleri yazabilirsiniz.'
    }
  ]);

  const service = useLlmService(import.meta.env.VITE_APP_API_LLM_CONTROLLER);

  const handleSearch = async () => {
    if (!value.trim()) return;

    const userPrompt = value;
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: userPrompt };
    
    // Mesajı sohbet akışına ekle
    setMessages((prev) => [...prev, userMessage]);
    setValue('');
    setLoading(true);

    try {
      // LLM filtresi istek atma
      const getMembers = await service.getMembersByText(userPrompt);

      if (getMembers && Array.isArray(getMembers) && getMembers.length > 0) {
        onFilterApply(getMembers);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Filtre uygulandı! Toplam ${getMembers.length} üye bulundu ve liste güncellendi.`
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        onFilterApply([]);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Aradığınız kriterlere uygun üye bulunamadı veya sonuç boş döndü.'
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error: any) {
      toast.error('Üyeler filtrelenirken hata oluştu.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Bir bağlantı hatası oluştu. Lütfen tekrar deneyiniz.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sağ Alt Chat Açma Butonu */}
      <Affix position={{ bottom: 20, left: 20 }}>
        <Transition transition="slide-up" mounted={!opened}>
          {(transitionStyles) => (
            <Button
              leftSection={<IconMessageChatbot size={20} />}
              style={transitionStyles}
              onClick={() => setOpened(true)}
              color="indigo"
              radius="xl"
              size="lg"
            >
              AI Akıllı Filtre
            </Button>
          )}
        </Transition>
      </Affix>

      {/* Chat Penceresi */}
      <Affix position={{ bottom: 20, left: 20 }} zIndex={1001}>
        <Transition transition="scale-y" mounted={opened}>
          {(transitionStyles) => (
            <Paper
              withBorder
              shadow="xl"
              p="md"
              radius="md"
              style={{ ...transitionStyles, width: 380, height: 450 }}
            >
              <Stack justify="space-between" h="100%">
                {/* Header */}
                <Group justify="space-between" pb="xs" style={{ borderBottom: '1px solid #eee' }}>
                  <Group gap="xs">
                    <IconFilter size={18} color="#4C6EF5" />
                    <Text fw={600} size="sm">Akıllı Üye Filtreleme</Text>
                  </Group>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setOpened(false)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>

                {/* Chat Scroll Alanı */}
                <ScrollArea h={320} offsetScrollbars p="xs">
                  <Stack gap="xs">
                    {messages.map((msg) => (
                      <Group
                        key={msg.id}
                        justify={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                        align="flex-start"
                        gap="xs"
                      >
                        {msg.sender === 'bot' && (
                          <Avatar color="indigo" radius="xl" size="sm">
                            <IconRobot size={14} />
                          </Avatar>
                        )}
                        
                        <Box
                          p="xs"
                          style={{
                            borderRadius: '10px',
                            backgroundColor: msg.sender === 'user' ? '#4C6EF5' : '#F1F3F5',
                            color: msg.sender === 'user' ? '#fff' : '#000',
                            maxWidth: '75%',
                            fontSize: '12px'
                          }}
                        >
                          <Text size="xs">{msg.text}</Text>
                        </Box>

                        {msg.sender === 'user' && (
                          <Avatar color="blue" radius="xl" size="sm">
                            <IconUser size={14} />
                          </Avatar>
                        )}
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea>

                {/* Input ve Gönder Butonu */}
                <TextInput
                  placeholder="Kriterleri yazın (Örn: Mersin aktif burslu)..."
                  value={value}
                  onChange={(event) => setValue(event.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                  rightSection={
                    <ActionIcon
                      loading={loading}
                      onClick={handleSearch}
                      color="indigo"
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
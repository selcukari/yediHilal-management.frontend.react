import { useState, useRef, useEffect } from 'react';
import { Paper, TextInput, Group, Stack, Text, Avatar, ScrollArea, Loader, ActionIcon } from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconRefresh } from '@tabler/icons-react';
import { useOpenApiService } from '../services/openApiService';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatComponentProps {
  title?: string;
  height?: number;
}

export function ChatComponent({ title = "YediHilal AI Asistan", height = 600 }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const viewport = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Servisimizi "chat" controller'ı ile başlatıyoruz
  const service = useOpenApiService();

  // 1. Oturum Başlatma (Giriş yapmayan kullanıcılar için defaultUser kullanılır)
  const initChat = async () => {
    try {
      const sessionData = await service.createSession(); // openApiService içindeki defaultUser'ı kullanır
      setSessionId(sessionData.session_id);
      setMessages([]);
    } catch (error) {
      console.error("Sohbet başlatılamadı:", error);
    }
  };

  useEffect(() => {
    initChat();
  }, []);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionId) return;

    const userText = inputMessage;
    const userMsgId = Date.now().toString();

    // Kullanıcı mesajını ekle
    setMessages(prev => [...prev, {
      id: userMsgId,
      text: userText,
      isUser: true,
      timestamp: new Date()
    }]);

    setInputMessage('');
    setIsLoading(true);

    // Bot için boş placeholder oluştur
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      text: '',
      isUser: false,
      timestamp: new Date()
    }]);

    // İsteği iptal edebilmek için controller
    abortControllerRef.current = new AbortController();

    try {
      let accumulatedText = "";
      
      await service.streamChat(
        { session_id: sessionId, query: userText },
        (chunk) => {
          accumulatedText += chunk;
          // Sadece ilgili bot mesajının içeriğini güncelle
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg)
          );
        },
        abortControllerRef.current.signal
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: "Bir hata oluştu, lütfen tekrar deneyin." } : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper shadow="md" p="md" withBorder radius="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack justify="space-between" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* Header */}
        <Group justify="space-between" pb="xs" style={{ borderBottom: '1px solid #eee' }}>
          <Group gap="sm">
            <Avatar color="blue" radius="md"><IconRobot size={20} /></Avatar>
            <div>
              <Text fw={700} size="sm">{title}</Text>
              <Text size="xs" c="green.6">● Çevrimiçi</Text>
            </div>
          </Group>
        </Group>

        {/* Messages List */}
        <ScrollArea viewportRef={viewport} style={{ height: height - 160, flex: 1 }} scrollbarSize={6}>
          <Stack gap="lg" p="xs">
            {messages.length === 0 && !isLoading && (
              <Text ta="center" c="dimmed" size="sm" mt="xl">Size nasıl yardımcı olabilirim?</Text>
            )}

            {messages.map((message) => (
              <Group 
                key={message.id} 
                align="flex-start" 
                justify={message.isUser ? 'flex-end' : 'flex-start'} 
                wrap="nowrap"
              >
                {!message.isUser && <Avatar size="sm" color="blue" radius="xl"><IconRobot size={16} /></Avatar>}
                
                <Paper 
                  p="sm" 
                  bg={message.isUser ? 'blue.6' : 'gray.1'} 
                  c={message.isUser ? 'white' : 'gray.9'}
                  style={{ 
                    maxWidth: '85%', 
                    borderRadius: message.isUser ? '16px 16px 2px 16px' : '2px 16px 16px 16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {message.text || (isLoading && !message.isUser && "...")}
                  </Text>
                </Paper>

                {message.isUser && <Avatar size="sm" color="blue.1" radius="xl" variant="filled"><IconUser size={16} color="blue" /></Avatar>}
              </Group>
            ))}
          </Stack>
        </ScrollArea>

        {/* Input Area */}
        <Group gap="xs" pt="md" style={{ borderTop: '1px solid #eee' }}>
          <TextInput
            placeholder={sessionId ? "Mesajınızı yazın..." : "Sistem hazırlanıyor..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.currentTarget.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading || !sessionId}
            style={{ flex: 1 }}
            radius="xl"
            rightSection={isLoading && <Loader size="xs" />}
          />
          <ActionIcon 
            onClick={handleSendMessage} 
            size="lg" 
            radius="xl" 
            variant="filled" 
            color="blue"
            disabled={!inputMessage.trim() || isLoading}
          >
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
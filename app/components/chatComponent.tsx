import { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  TextInput, 
  Button, 
  Group, 
  Stack, 
  Text, 
  Avatar, 
  ScrollArea,
  Loader,
  ActionIcon
} from '@mantine/core';
import { IconSend, IconRobot, IconUser } from '@tabler/icons-react';
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

export function ChatComponent({ title = "AI Asistan", height = 400 }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  const service = useOpenApiService(import.meta.env.VITE_APP_API_OPENAPI_CONTROLLER);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await service.sendMessageOpenApi({message: inputMessage});

      console.log("aiResponse:", aiResponse)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder style={{ height: '100%' }}>
      <Stack justify="space-between" style={{ height: '100%' }}>
        {/* Header */}
        <Group>
          <IconRobot size={24} color="blue" />
          <Text fw={600} size="lg">{title}</Text>
        </Group>

        {/* Messages */}
        <ScrollArea viewportRef={viewport} style={{ height: height - 120, flex: 1 }}>
          <Stack gap="md">
            {messages.length === 0 && (
              <Paper p="md" bg="gray.0" ta="center">
                <Text size="sm" c="dimmed">
                  Merhaba! Size nasıl yardımcı olabilirim?
                </Text>
              </Paper>
            )}
            
            {messages.map((message) => (
              <Group 
                key={message.id} 
                align="flex-start" 
                justify={message.isUser ? 'flex-end' : 'flex-start'}
                wrap="nowrap"
              >
                {!message.isUser && (
                  <Avatar size="sm" color="blue" radius="xl">
                    <IconRobot size={16} />
                  </Avatar>
                )}
                
                <Paper 
                  p="sm" 
                  bg={message.isUser ? 'blue.6' : 'gray.1'}
                  c={message.isUser ? 'white' : 'black'}
                  style={{ 
                    maxWidth: '70%',
                    borderRadius: message.isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'
                  }}
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Text>
                  <Text size="xs" c={message.isUser ? 'gray.3' : 'gray.6'} ta="right" mt={4}>
                    {message.timestamp.toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </Paper>

                {message.isUser && (
                  <Avatar size="sm" color="gray" radius="xl">
                    <IconUser size={16} />
                  </Avatar>
                )}
              </Group>
            ))}
            
            {isLoading && (
              <Group justify="flex-start">
                <Avatar size="sm" color="blue" radius="xl">
                  <IconRobot size={16} />
                </Avatar>
                <Paper p="sm" bg="gray.1" style={{ borderRadius: '12px 12px 12px 4px' }}>
                  <Loader size="sm" type="dots" />
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>

        {/* Input */}
        <Group gap="xs">
          <TextInput
            placeholder="Mesajınızı yazın..."
            value={inputMessage}
            onChange={(event) => setInputMessage(event.currentTarget.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={{ flex: 1 }}
            radius="md"
          />
          <ActionIcon
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="lg"
            radius="md"
            variant="filled"
            color="blue"
          >
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
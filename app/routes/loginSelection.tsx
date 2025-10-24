import { useNavigate } from "react-router";
import { IconUser, IconUsers } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Text, Stack, Title, RingProgress,Badge,
  Paper, Button, LoadingOverlay, Flex, Table, Group, ActionIcon,
} from '@mantine/core';

export default function LoginSelection() {
  const navigate = useNavigate();

  return (
    <Container size="sm" py={100}>
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">Hoş Geldiniz</Title>
        <Text c="dimmed" ta="center" size="lg">
          Lütfen giriş türünüzü seçin
        </Text>
        
        <Group justify="center" mt={30} gap="xl">
          <Button
            size="xl"
            leftSection={<IconUsers size={24} />}
            onClick={() => navigate('/memberLogin')} // Bu route'u oluşturmanız gerekecek
            variant="filled"
            color="blue"
            w={200}
            h={100}
          >
            Üye Girişi
          </Button>
          
          <Button
            size="xxl"
            leftSection={<IconUser size={24} />}
            onClick={() => navigate('/userLogin')} // Bu route'u oluşturmanız gerekecek
            variant="outline"
            color="gray"
            w={200}
            h={100}
          >
            Kullanıcı Girişi
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
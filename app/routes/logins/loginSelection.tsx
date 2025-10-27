import { useNavigate } from "react-router";
import { IconUser, IconUsers, IconBuildings, IconSchool } from '@tabler/icons-react';
import {
  Container, Text, Stack, Title,
  Button, Group,
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

          <Button
            size="xxl"
            leftSection={<IconBuildings size={24} />}
            onClick={() => navigate('/branchLogin')} // Bu route'u oluşturmanız gerekecek
            variant="filled"
            color="blue"
            w={200}
            h={100}
          >
            Temsilcilik Girişi
          </Button>

          <Button
            size="xxl"
            leftSection={<IconSchool size={24} />}
            onClick={() => navigate('/universityBranchLogin')} // Bu route'u oluşturmanız gerekecek
            variant="outline"
            color="gray"
            w={200}
            h={100}
          >
            Üniversite Girişi
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
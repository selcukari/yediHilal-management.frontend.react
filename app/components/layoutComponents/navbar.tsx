import React from 'react';
import { Group, Image,  Title,  Button,  Avatar,  Menu, Box,  Burger, AppShell} from '@mantine/core';
import { IconBell, IconLogout, IconUser, IconSettings} from '@tabler/icons-react';
import { useAuth } from '../../authContext';

interface NavbarProps {
  opened: boolean;
  toggle: () => void;
}

export function Navbar({ opened, toggle }: NavbarProps) {
  const { isLoggedIn, logout } = useAuth();

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <Image
            h={50}
            w="auto"
            fit="contain"
            radius="md"
            src="https://yedihilal.org/wp-content/uploads/2023/12/yedihilal-yatayLogo.png"
          />
          
           <Box style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <Title order={3} c="blue">
            YediHilal Yönetim
          </Title>
        </Box>
        </Group>
        
        <Group>
          <Button variant="subtle" leftSection={<IconBell size={16} />}>
            Bildirimler
          </Button>
          
          
          { isLoggedIn ? (
            <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" leftSection={<Avatar size="sm" />}>
                Profil
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Hesap</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>
                Profili Düzenle
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />}>
                Ayarlar
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                color="red"
                onClick={logout}
                leftSection={<IconLogout size={14} />}
              >
                Çıkış Yap
              </Menu.Item>
            </Menu.Dropdown>
            </Menu>) : (

          <Button>Giriş Yap</Button>)}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
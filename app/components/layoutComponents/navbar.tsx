import React from 'react';
import {
  Group,
  Title,
  Button,
  Avatar,
  Menu,
  Burger,
  AppShell,
} from '@mantine/core';
import {
  IconBell,
  IconLogout,
  IconUser,
  IconSettings,
} from '@tabler/icons-react';
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
          <Title order={3} c="blue">
            Yedi Hilal Yönetim
          </Title>
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
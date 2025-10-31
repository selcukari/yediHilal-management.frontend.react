import { Group, Image, Title, Button, Avatar, Menu, Box, Burger, AppShell, Switch, useMantineColorScheme } from '@mantine/core';
import { IconBell, IconLogout, IconMoon, IconSun } from '@tabler/icons-react';
import { useAuth } from '../../authContext';
import { useNavigate } from "react-router";

interface NavbarProps {
  opened: boolean;
  toggle: () => void;
}

export function Navbar({ opened, toggle }: NavbarProps) {
  const { isLoggedIn, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        {/* Sol taraf: Burger menu + Logo */}
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm"
          />
          <Image h={50} w="auto" fit="contain" radius="md" src="https://yedihilal.org/wp-content/uploads/2023/12/yedihilal-yatayLogo.png"
          />
        </Group>

        {/* Orta: Başlık - sadece desktop'ta */}
        <Box visibleFrom="sm" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <Title order={3} c="blue">
            YediHilal Yönetim/Üye
          </Title>
        </Box>

        {/* Sağ taraf: Bildirimler ve Profil */}
        <Group>
          {/* Bildirimler butonu - sadece desktop'ta göster */}
          {false && <Button variant="subtle" leftSection={<IconBell size={16} />} visibleFrom="sm">
            Bildirimler
          </Button> }
          
          {/* Profil menüsü - hem desktop hem mobile'da */}
          {isLoggedIn ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle" leftSection={<Avatar size="sm" />}>
                  <Box component="span" visibleFrom="sm">Profil</Box>
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Hesap</Menu.Label>
                {/* Dark/Light Mode Switch */}
                <Menu.Item
                  leftSection={colorScheme === 'dark' ? <IconMoon size={14} /> : <IconSun size={14} />}
                  rightSection={
                    <Switch
                      size="sm"
                      checked={colorScheme === 'dark'}
                      onChange={() => toggleColorScheme()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  {colorScheme === 'dark' ? 'Dark Mod' : 'Light Mod'}
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
            </Menu>
          ) : (
            <Button visibleFrom='sm' onClick={() => navigate("/loginSelection")}>Giriş Yap</Button>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
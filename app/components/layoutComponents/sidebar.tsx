import React from 'react';
import {
  NavLink, Flex,  Text,  Stack,  Divider,  Group,  ScrollArea,  AppShell,
} from '@mantine/core';
import {
  IconUser,  IconDashboard,  IconUsers,  IconSettings,  IconFileText,  IconChartBar,  IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
}
// IconDashboard
const menuItems = [
  { icon: IconUsers, label: 'Üye Yönetimi', key: 'dashboard', link: '/' },
  { icon: IconUser, label: 'Kullanıcılar', key: 'users', link: '/users' },
  { icon: IconFileText, label: 'Dökümanlar', key: 'documents', link: '/documents' },
  { icon: IconChartBar, label: 'Raporlar', key: 'reports', link: '/reports' },
  { icon: IconSettings, label: 'Ayarlar', key: 'settings', link: '/settings' },
];

export function Sidebar({ active, setActive }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // URL'e göre aktif menüyü belirle
  React.useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => item.link === currentPath);
    if (activeItem) {
      setActive(activeItem.key);
    }
  }, [location.pathname, setActive]);

  const handleMenuItemClick = (key: string, link: string) => {
    setActive(key);
    navigate(link);
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow component={ScrollArea}>
        <Stack gap="xs">
          <Flex
            gap="md"
            justify="center"
            align="flex-start"
            direction="row"
            wrap="wrap"
          >
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="sm" >
              Menü
            </Text>
          </Flex>
          
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              active={item.key === active}
              label={item.label}
              leftSection={<item.icon size="1rem" stroke={1.5} />}
              rightSection={<IconChevronRight size="0.8rem" stroke={1.5} />}
              onClick={() => handleMenuItemClick(item.key, item.link)}
              variant="filled"
            />
          ))}
        </Stack>
      </AppShell.Section>

      <AppShell.Section>
        <Divider my="sm" />
        <Group justify="center">
          <Text size="xs" c="dimmed">v1.0.0</Text>
        </Group>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
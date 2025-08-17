import React from 'react';
import {
  NavLink,
  Text,
  Stack,
  Divider,
  Group,
  ScrollArea,
  AppShell,
} from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconSettings,
  IconFileText,
  IconChartBar,
  IconChevronRight,
} from '@tabler/icons-react';

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
}

const menuItems = [
  { icon: IconDashboard, label: 'Dashboard', key: 'dashboard' },
  { icon: IconUsers, label: 'Kullanıcılar', key: 'users' },
  { icon: IconFileText, label: 'Dökümanlar', key: 'documents' },
  { icon: IconChartBar, label: 'Raporlar', key: 'reports' },
  { icon: IconSettings, label: 'Ayarlar', key: 'settings' },
];

export function Sidebar({ active, setActive }: SidebarProps) {
  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow component={ScrollArea}>
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="sm">
            Menü
          </Text>
          
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              active={item.key === active}
              label={item.label}
              leftSection={<item.icon size="1rem" stroke={1.5} />}
              rightSection={<IconChevronRight size="0.8rem" stroke={1.5} />}
              onClick={() => setActive(item.key)}
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
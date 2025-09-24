import { useEffect, useState } from 'react';
import {
  NavLink, Flex, Text, Stack, Divider, Group, ScrollArea, AppShell,
} from '@mantine/core';
import {
  IconUser, IconMail, IconUsers, IconSettings, IconMessage, IconChartBar, IconFileCheck, IconCar, IconCoin,
  IconChevronRight, IconClipboardList, IconCalendarTime, IconSettingsAutomation, IconChevronDown, IconReportMoney,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '~/authContext';
import { toast } from '../../utils/toastMessages';

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
}

const menuItems = [
  { icon: IconUsers, label: 'Üye Yönetimi', key: 'member', link: '/' },
  { icon: IconUser, label: 'Kullanıcı Yönetimi', key: 'user', link: '/users' },
  { icon: IconMail, label: 'Gön. Mail Lis.', key: 'mail', link: '/mails' },
  { icon: IconMessage, label: 'Gön. Sms Lis.', key: 'sms', link: '/sms' },
  { icon: IconChartBar, label: 'Raporlar', key: 'report', link: '/reports' },
  { icon: IconCoin, label: 'Kasa Yönetimi', key: 'safe', link: '/safe' },
  {
    icon: IconClipboardList,
    label: 'Stock Yönetimi',
    key: 'stock',
    link: '/stocks',
    children: [
      { label: 'Emanetler', key: 'stockDeposit', link: '/stockDeposits' },
      { label: 'Giderler', key: 'stockExpense', link: '/stockExpenses' },
      { label: 'Depo', key: 'stock-depo', link: '/stocks' },
    ],
  },
  { icon: IconSettings, label: 'Ayarlar', key: 'setting', link: '/settings',
    children: [
      { label: 'Görevler', key: 'duty', link: '/settings-duty' },
      { label: 'Toplantı Türleri', key: 'meetingType', link: '/settings-meetingType' },
    ],
   },
  {
    icon: IconFileCheck,
    label: 'Proje Yönetimi',
    key: 'project',
    link: '/projects',
  },
  {
    icon: IconFileCheck,
    label: 'Şubeler Yönetimi',
    key: 'branch',
    link: '/branches',
  },
   {
    icon: IconReportMoney,
    label: 'Maliye Yönetimi',
    key: 'finance',
    link: '/finances',
    children: [
      { label: 'A Maliye', key: 'a-finance', link: '/a-finances' },
      { label: 'B Maliye', key: 'b-finance', link: '/b-finances' },
      { label: 'Maliyeler', key: 'finance-all', link: '/finances' },
    ],
  },
  {
    icon: IconCalendarTime,
    label: 'Toplantı Yönetimi',
    key: 'meeting',
    link: '/meetings',
  },
  {
    icon: IconCar,
    label: 'Araç Yönetimi',
    key: 'vehicle',
    link: '/vehicles',
    children: [
      { label: 'Emanet Araçlar', key: 'vehicleDeposits', link: '/vehicleDeposits' },
      { label: 'Araçlar', key: 'vehicles', link: '/vehicles' },
    ],
  },
   {
    icon: IconSettingsAutomation,
    label: 'Otomatik Mesaj Yönetimi',
    key: 'automaticMessageManagenet',
    link: '/vehicles',
    children: [
      { label: 'Otomatik Sms/WhatsApp Yön.', key: 'automaticSmsManagement', link: '/automaticSmsManagement' },
      { label: 'Otomatik Mail Yön.', key: 'automaticMailManagement', link: '/automaticMailManagement' },
    ],
  },
];

export function Sidebar({ active, setActive }: SidebarProps) {
  const { isLoggedIn, currentUser } = useAuth();
  const [openedItems, setOpenedItems] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // URL'e göre aktif menüyü belirle
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => item.link === currentPath) || 
      menuItems.flatMap(item => item.children || []).find(child => child.link === currentPath);
    
    if (activeItem) {
      setActive(activeItem.key);
      
      // Eğer aktif öğe bir alt menü öğesiyse, ana menüyü de açık hale getir
      const parentItem = menuItems.find(item => 
        item.children && item.children.some(child => child.key === activeItem.key)
      );
      
      if (parentItem && !openedItems.includes(parentItem.key)) {
        setOpenedItems([...openedItems, parentItem.key]);
      }
    }
  }, [location.pathname, setActive]);

  const handleMenuItemClick = (key: string, link: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      // Alt menüyü aç/kapat
      setOpenedItems(prev => 
        prev.includes(key) 
          ? prev.filter(item => item !== key) 
          : [...prev, key]
      );
      return;
    }

    setActive(key);

    if(currentUser.moduleRoles?.includes(key)) {
      navigate(link);
      return;
    }

    if ([2,3].includes(currentUser?.roleId) && !['/', '/mails', '/sms'].includes(link)) {
      toast.error('Bu işlem için yetkiniz bulunmamaktadır.');
      return;
    }
    navigate(link);
  };

  return (
    <AppShell.Navbar p="md">
      { isLoggedIn && <AppShell.Section grow component={ScrollArea}>
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
            <div key={item.key}>
              <NavLink
                active={item.key === active || (item.children || []).some(child => child.key === active)}
                label={item.label}
                leftSection={<item.icon size="1rem" stroke={1.5} />}
                rightSection={
                  item.children ? (
                    openedItems.includes(item.key) ? 
                      <IconChevronDown size="0.8rem" stroke={1.5} /> : 
                      <IconChevronRight size="0.8rem" stroke={1.5} />
                  ) : (
                    <IconChevronRight size="0.8rem" stroke={1.5} />
                  )
                }
                onClick={() => handleMenuItemClick(item.key, item.link, !!item.children)}
                opened={openedItems.includes(item.key)}
                variant="filled"
                childrenOffset={28}
              >
                {item.children && openedItems.includes(item.key) && (
                  item.children.map((child) => (
                    <NavLink
                      key={child.key}
                      label={child.label}
                      active={child.key === active}
                      onClick={() => handleMenuItemClick(item.key, child.link)}
                    />
                  ))
                )}
              </NavLink>
            </div>
          ))}
        </Stack>
      </AppShell.Section> }
      { isLoggedIn && <AppShell.Section>
        <Divider my="sm" />
        <Group justify="center">
          <Text size="xs" c="dimmed">{`v${import.meta.env.VITE_APP_VERSION}`}</Text>
        </Group>
      </AppShell.Section> }
    </AppShell.Navbar>
  );
}
import { useEffect, useState } from 'react';
import {
  NavLink, Flex, Text, Stack, Divider, Group, ScrollArea, AppShell,
} from '@mantine/core';
import {
  IconUsers, IconFileCheck, IconCoin, IconClipboardList,
  IconChevronRight, IconChevronDown, IconUser,
  IconSchool, IconCalendarTime, IconPhoneCall,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '~/authContext';

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
}

interface MenuItem {
  icon?: any;
  label: string;
  key: string;
  link: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: IconUsers, label: 'Üye Yönetimi', key: 'member', link: '/' },
   {
    icon: IconFileCheck,
    label: 'Proje Yönetimi',
    key: 'project',
    link: '/projects',
  },
  {
    icon: IconCalendarTime,
    label: 'Toplantı Yönetimi',
    key: 'meeting',
    link: '/meetings',
  },
  {
    icon: IconSchool,
    label: 'Üniversite Yönetimi',
    key: 'universityBranch',
    link: '/university-branches',
  },
  { icon: IconClipboardList, label: 'Stok Yönetimi', key: 'stock', link: '/requestStocks',
     children: [
      { label: 'Ürün Taleplerim', key: 'requestStock', link: '/requestStocks' }, 
     ],
   },
  { label: 'Finans Yönetimi', key: 'finance', link: '/financeManagements',
    children: [
      { icon: IconCoin, label: 'Finans', key: 'finance', link: '/finances' },
      { icon: IconPhoneCall, label: 'Arama Takip', key: 'phoneCallTracking', link: '/phoneCallTrackings' },
    ], 
  },
  { icon: IconUser, label: 'Kullanıcı Yönetimi', key: 'user', link: '/users' },
];

// Recursive function to find all menu items including nested children
const findAllMenuItems = (items: MenuItem[]): MenuItem[] => {
  const allItems: MenuItem[] = [];
  
  items.forEach(item => {
    allItems.push(item);
    if (item.children) {
      allItems.push(...findAllMenuItems(item.children));
    }
  });
  
  return allItems;
};

// Recursive function to find parent keys for a given key
const findParentKeys = (items: MenuItem[], targetKey: string, parentKeys: string[] = []): string[] => {
  for (const item of items) {
    if (item.key === targetKey) {
      return parentKeys;
    }
    
    if (item.children) {
      const found = findParentKeys(item.children, targetKey, [...parentKeys, item.key]);
      if (found.length > 0) {
        return found;
      }
    }
  }
  
  return [];
};

// Recursive NavLink component for nested menus
const RecursiveNavLink = ({ 
  item, 
  active, 
  openedItems, 
  setOpenedItems, 
  handleMenuItemClick,
  level = 0 
}: { 
  item: MenuItem;
  active: string;
  openedItems: string[];
  setOpenedItems: (items: string[]) => void;
  handleMenuItemClick: (key: string, link: string, hasChildren: boolean) => void;
  level?: number;
}) => {
  const hasChildren = !!item.children && item.children.length > 0;
  const isActive = item.key === active || (item.children && item.children.some(child => child.key === active));
  const isOpened = openedItems.includes(item.key);

  const handleClick = () => {
    handleMenuItemClick(item.key, item.link, hasChildren);
  };

  return (
    <NavLink
      active={isActive}
      label={item.label}
      leftSection={item.icon ? <item.icon size="1rem" stroke={1.5} /> : undefined}
      rightSection={
        hasChildren ? (
          isOpened ? 
            <IconChevronDown size="0.8rem" stroke={1.5} /> : 
            <IconChevronRight size="0.8rem" stroke={1.5} />
        ) : undefined
      }
      onClick={handleClick}
      opened={isOpened}
      variant="filled"
      childrenOffset={28}
    >
      {hasChildren && isOpened && (
        item?.children?.map((child) => (
          <RecursiveNavLink
            key={child.key}
            item={child}
            active={active}
            openedItems={openedItems}
            setOpenedItems={setOpenedItems}
            handleMenuItemClick={handleMenuItemClick}
            level={level + 1}
          />
        ))
      )}
    </NavLink>
  );
};

export function Sidebar({ active, setActive }: SidebarProps) {
  const { isLoggedIn, currentUser } = useAuth();
  const [openedItems, setOpenedItems] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // URL'e göre aktif menüyü belirle
  useEffect(() => {
    const currentPath = location.pathname;
    const allItems = findAllMenuItems(menuItems);
    const activeItem = allItems.find(item => item.link === currentPath);
    
    if (activeItem) {
      setActive(activeItem.key);
      
      // Aktif öğenin tüm parent'larını açık hale getir
      const parentKeys = findParentKeys(menuItems, activeItem.key);
      setOpenedItems(prev => {
        const newOpenedItems = [...prev];
        parentKeys.forEach(key => {
          if (!newOpenedItems.includes(key)) {
            newOpenedItems.push(key);
          }
        });
        return newOpenedItems;
      });
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
            <RecursiveNavLink
              key={item.key}
              item={item}
              active={active}
              openedItems={openedItems}
              setOpenedItems={setOpenedItems}
              handleMenuItemClick={handleMenuItemClick}
            />
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
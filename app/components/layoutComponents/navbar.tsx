import { useRef } from 'react';
import { Group, Image, Title, Button, Avatar, Menu, Box, Burger, AppShell, Switch, useMantineColorScheme } from '@mantine/core';
import { IconBell, IconLogout, IconUser, IconMoon, IconSun } from '@tabler/icons-react';
import { useAuth } from '../../authContext';
import { useNavigate } from "react-router";
import { toast } from '../../utils/toastMessages';
import UserEdit, { type UserEditDialogControllerRef } from '../../components/users/userEdit';
import { useUserService } from '~/services/userService';

interface NavbarProps {
  opened: boolean;
  toggle: () => void;
}

interface DutiesType {
  ids: string;
  names: string;
  createDate: string;
  authorizedPersonId: number;
  authorizedPersonName: string;
}

export function Navbar({ opened, toggle }: NavbarProps) {
  const { isLoggedIn, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const userEditRef = useRef<UserEditDialogControllerRef>(null);

  const handleSaveSuccess = () => {
    setTimeout(() => {
      navigate("/")
    }, 500);
  };

  const handleEdit = async () => {
    if (currentUser?.id) {
      const getUser = await service.user(currentUser.id as number);
      if (getUser) {
        const duties = (getUser.duties ? JSON.parse(getUser.duties) : []) as DutiesType[];

        userEditRef.current?.openDialog({
          id: getUser.id,
          fullName: getUser.fullName,
          identificationNumber: getUser.identificationNumber,
          email: getUser.email,
          countryCode: getUser.countryCode,
          phone: getUser.phone,
          dateOfBirth: getUser.dateOfBirth ? getUser.dateOfBirth.toString() : '',
          isActive: getUser.isActive,
          password: getUser.password,
          moduleRoles: getUser.moduleRoles,
          roleId: getUser.roleId?.toString(),
          districtId: getUser.districtId?.toString(), 
          countryId: getUser.countryId?.toString(),
          provinceId: getUser.provinceId?.toString(),
          dutiesIds: duties && duties[duties.length - 1]?.ids as string,
          duties: duties, 
          deleteMessageTitle: getUser.deleteMessageTitle?.toString(),
          updateDate: getUser.updateDate,
        });
      } else {
        toast.info('Hiçbir veri yok!');
      }
    }
  };

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
            YediHilal Yönetim
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
                <Menu.Item leftSection={<IconUser size={14} />} onClick={handleEdit}>
                  Profili Düzenle
                </Menu.Item>
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
      <UserEdit ref={userEditRef} onSaveSuccess={handleSaveSuccess} />
    </AppShell.Header>
  );
}
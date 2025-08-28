import { useRef } from 'react';
import { Group, Image,  Title,  Button,  Avatar,  Menu, Box,  Burger, AppShell} from '@mantine/core';
import { IconBell, IconLogout, IconUser, IconSettings} from '@tabler/icons-react';
import { useAuth } from '../../authContext';
import { useNavigate } from "react-router";
import { toast } from '../../utils/toastMessages';
import UserEdit, { type UserEditDialogControllerRef } from '../../components/users/userEdit';
import { useUserService } from '~/services/userService';
interface NavbarProps {
  opened: boolean;
  toggle: () => void;
}

export function Navbar({ opened, toggle }: NavbarProps) {
  const { isLoggedIn, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const service = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const userEditRef = useRef<UserEditDialogControllerRef>(null);

   const handleSaveSuccess = () => {

    setTimeout(() => {
      navigate("/")
    }, 500);
  };

    const handleEdit = async() => {
      if (currentUser?.id) {
        const getUser = await service.user(currentUser.id as number);

        if (getUser) {

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
          roleId: getUser.roleId.toString(),
          countryId: getUser.countryId.toString(),
          provinceId: getUser.provinceId?.toString(),
          deleteMessageTitle: getUser.deleteMessageTitle?.toString(),
          createdDate: getUser.createdDate,
          updateDate: getUser.updateDate,
        });

        }
        else {
          toast.info('Hiçbir veri yok!');
        }
      };
  };
  
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
              <Menu.Item leftSection={<IconUser size={14} />} onClick={handleEdit}>
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
      <UserEdit ref={userEditRef} onSaveSuccess={handleSaveSuccess} />
    </AppShell.Header>
  );
}
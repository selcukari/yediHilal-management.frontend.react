import {
  Container, Paper, TextInput, PasswordInput, Button, Title, Text,
  LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router';
import { useAuth } from '../../authContext';
import { toast } from '~/utils/toastMessages';

export default function UserLogin() {
  const { login, loading: authLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      email: 'example4@example.com',
      password: '147852',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçerli bir e-posta girin'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const universityBranchDutyId = "20"; // universite baskanı görevi id'si
    try {
      open()
      const response = await login(values.email, values.password, "universityBranchLogin", universityBranchDutyId);

      if (response == true) {
        close()
        setTimeout(() => {
          navigate("/");
          window.location.reload(); // Sayfayı yenile ile gorunmeyen menuler gelmemesi icin
        }, 300);
      } else {
        close()
        toast.error('Giriş başarısız. E-posta ve şifrenizi kontrol edin.');
      }

    } catch (error: any) {
      close()
      toast.error('Giriş başarısız. E-posta ve şifrenizi kontrol edin.');
    }
  };

  return (
    <Container size={420} my={40}>
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'pink', type: 'bars' }}
      />
      <Title ta="center" mb="md">Giriş Yap</Title>
      <Text size="sm" ta="center" mb="xl">
        Devam etmek için e-posta ve şifrenizi giriniz
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="E-posta"
            placeholder="ornek@site.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Şifre"
            placeholder="Şifreniz"
            required
            mt="md"
            {...form.getInputProps('password')}
          />

          <Button 
            fullWidth 
            mt="xl" 
            type="submit" 
            loading={authLoading}
            disabled={authLoading}
          >
            Giriş Yap
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
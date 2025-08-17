import { Container, Paper, TextInput, PasswordInput, Button, Title, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../authContext';

export default function Login() {
  const [error, setError] = useState('');
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: 'yedihilaladmin@gmail.com',
      password: '123456',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçerli bir e-posta girin'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      await login(values.email, values.password);
      navigate('/');
    } catch (error: any) {
      setError('Giriş başarısız. E-posta ve şifrenizi kontrol edin. ' + error.message);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">Giriş Yap</Title>
      <Text size="sm" ta="center" mb="xl">
        Devam etmek için e-posta ve şifrenizi giriniz
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}
        
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
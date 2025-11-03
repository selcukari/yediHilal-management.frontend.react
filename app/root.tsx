// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/tr';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps, createTheme } from '@mantine/core';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './authContext';
import { Layout as AppLayout, MemberLayout, BranchLayout, UniversityBranchLayout } from './components';
import { CustomLayout } from './components';
import ProtectedRoute from './protectedRoute'
import type { Route } from "./+types/root";
import { Container, Title, Text, Button, Group, Stack, Code, Alert } from '@mantine/core';
import { IconAlertCircle, IconHome, IconRefresh } from '@tabler/icons-react';
import { getWithExpiry } from './utils/useLocalStorage';
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Mantine tema konfigürasyonu
const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'blue',
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const location = useLocation();
  const [locationPathname, setLocationPathname] = useState<boolean>(true);
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useAuth();

  useEffect(() => {
    setLocationPathname(!['/memberCreate', '/privacyPolicy'].includes(location.pathname));

    // Eğer kullanıcı giriş yapmamışsa ve ana sayfadaysa login selection'a yönlendir
    if (!isLoggedIn) {
      navigate('/loginSelection', { replace: true });
    }
  }, []);

  // Layout seçimi için fonksiyon
  const renderLayout = () => {
    if (!isLoggedIn) {
      return (
        <CustomLayout>
          <Outlet />
        </CustomLayout>
      );
    }

    switch (currentUser?.userType) {
      case "userLogin":
        return (
          <AppLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </AppLayout>
        );
      case "memberLogin":
        return (
          <MemberLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </MemberLayout>
        );
      case "branchLogin":
        return (
          <BranchLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </BranchLayout>
        );
      case "universityBranchLogin":
        return (
          <UniversityBranchLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </UniversityBranchLayout>
        );
      default:
        return (
          <CustomLayout>
            <Outlet />
          </CustomLayout>
        );
    }
  };

  return (
    <>
      <Notifications position="top-right" />
      {locationPathname ? renderLayout() : (
        <CustomLayout>
          <Outlet />
        </CustomLayout>
      )}
    </>
  );
}

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}

// Basit ErrorBoundary - Router hook'ları kullanmadan
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Oops!";
  let message = "An unexpected error occurred.";
  let status = 500;
  let stack: string | undefined;
  const { currentUser } = useAuth();

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? "404 - Sayfa Bulunamadı" : "Hata";
    message =
      error.status === 404
        ? "Aradığınız sayfa bulunamadı. Sayfa taşınmış veya silinmiş olabilir."
        : error.statusText || message;
  } else if (import.meta.env.VITE_APP_IS_DEV && error && error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  const is404 = status === 404;
    // Layout seçimi için fonksiyon
  const goToHomeDefault = () => {
    let user = null;
    const storedUser = getWithExpiry('currentUser');
    if (storedUser) {
      user =  JSON.parse(storedUser);
    }

    switch (user?.userType) {
      case "memberLogin":
        window.location.href = '/member-for-memberUser';
        return;
      default:
        window.location.href = '/';
        return;
    }
  };

  // Ana sayfaya dön butonu için basit JavaScript kullanımı
  const goToHome = () => {
    window.location.href = '/';
  };

  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <div className="error-boundary">
            <Container size="md" py={80}>
              <Stack align="center" gap="xl">
                {/* 404 için özel ikon ve renk */}
                {is404 ? (
                  <Alert 
                    color="red" 
                    title={title}
                    icon={<IconAlertCircle size={24} />}
                    w="100%"
                    variant="filled"
                  >
                    <Text c="white" size="lg" fw={500}>
                      {message}
                    </Text>
                  </Alert>
                ) : (
                  <Alert 
                    color="orange" 
                    title={title}
                    icon={<IconAlertCircle size={24} />}
                    w="100%"
                  >
                    <Text size="lg" fw={500}>
                      {message}
                    </Text>
                  </Alert>
                )}

                {/* Görsel - 404 için özel */}
                {is404 && (
                  <div style={{ textAlign: 'center' }}>
                    <Title 
                      c="red" 
                      size={120} 
                      style={{ 
                        fontWeight: 900,
                        opacity: 0.7,
                        lineHeight: 1 
                      }}
                    >
                      404
                    </Title>
                    <Text size="xl" c="dimmed" fw={500}>
                      Sayfa Bulunamadı
                    </Text>
                  </div>
                )}

                {/* Aksiyon butonları */}
                <Group>
                  <Button
                    size="lg"
                    leftSection={<IconHome size={18} />}
                    onClick={goToHomeDefault}
                    variant={is404 ? "filled" : "light"}
                    color={is404 ? "red" : "blue"}
                  >
                    Ana Sayfaya Dön
                  </Button>
                </Group>

                {/* Geliştirme ortamında stack trace göster */}
                {import.meta.env.VITE_APP_IS_DEV && stack && (
                  <details style={{ width: '100%' }}>
                    <summary>Hata Detayları</summary>
                    <Code block style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                      {stack}
                    </Code>
                  </details>
                )}
              </Stack>
            </Container>
          </div>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  );
}
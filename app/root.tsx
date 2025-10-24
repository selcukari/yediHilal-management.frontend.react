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
import { AuthProvider } from './authContext';
import { Layout as AppLayout, MemberLayout } from './components';
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

export default function App() {
  const location = useLocation();
  const [locationPathname, setLocationPathname] = useState<boolean>(true);
  const [currentUserType, setCurrentUserType] = useState<string>("");

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const storedUser = getWithExpiry("currentUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
    return null;
  });

  useEffect(() => {
    setCurrentUserType(currentUser?.userType || "");
    setLocationPathname(!['/memberCreate', '/privacyPolicy'].includes(location.pathname));
  }, []);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      {locationPathname ? ( currentUserType === "userLogin" ?
        (<AuthProvider>
          <AppLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </AppLayout>
        </AuthProvider>) : (
          <AuthProvider>
          <MemberLayout>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </MemberLayout>
        </AuthProvider>
        )
      ) : (
        <CustomLayout>
          <Outlet />
        </CustomLayout>
      )}
    </MantineProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();
  let title = "Oops!";
  let message = "An unexpected error occurred.";
  let status = 500;
  let stack: string | undefined;

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

  return (
    <AppLayout>
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
              onClick={() => navigate('/')}
              variant={is404 ? "filled" : "light"}
              color={is404 ? "red" : "blue"}
            >
              Ana Sayfaya Dön
            </Button>
          </Group>
        </Stack>
      </Container>
    </AppLayout>
  );
}
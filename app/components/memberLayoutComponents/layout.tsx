import React, { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Footer } from './footer';
import { MainContent } from './mainContent';
import { useAuthStore } from '../../authContext'; // Sadece hook'u çağırıyoruz

interface LayoutProps {
  children?: React.ReactNode;
}

export function MemberLayout({ children }: LayoutProps = {}) {
  const [opened, { toggle }] = useDisclosure();
  const [activeSection, setActiveSection] = useState('dashboard');
  // Zustand'dan durumu ve başlatıcı fonksiyonu alıyoruz
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Sayfa/Layout ilk yüklendiğinde localstorage'daki token'ı doğrulamak için
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      footer={{ height: 60 }}
      padding="md"
    >
        <Navbar opened={opened} toggle={toggle} />
        <Sidebar active={activeSection} setActive={setActiveSection} />
      {children ? (
        <AppShell.Main>
          {children}
        </AppShell.Main>
      ) : (
        <MainContent activeSection={activeSection} />
      )}
      <Footer />
    </AppShell>
  );
}
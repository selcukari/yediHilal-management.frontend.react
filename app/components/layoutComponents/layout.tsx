import React, { useState } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Footer } from './footer';
import { MainContent } from './mainContent';
import { AuthProvider } from '../../authContext'

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps = {}) {
  const [opened, { toggle }] = useDisclosure();
  const [activeSection, setActiveSection] = useState('dashboard');

  return (<AuthProvider>
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
    </AppShell></AuthProvider>
  );
}
import React from 'react';
import { AppShell } from '@mantine/core';
import { Footer } from './footer';
import { MainContent } from './mainContent';

interface LayoutProps {
  children?: React.ReactNode;
}

export function CustomLayout({ children }: LayoutProps = {}) {
  console.log("children:", children)
  return (
    <AppShell
      header={{ height: 0 }}
      footer={{ height: 60 }}
      padding="md"
    >
      <AppShell.Main>
        {children || <MainContent activeSection="dashboard" />}
      </AppShell.Main>
      <Footer />
    </AppShell>
  );
}
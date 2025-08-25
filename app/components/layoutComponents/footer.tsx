import React from 'react';
import { Group, Text, AppShell } from '@mantine/core';

export function Footer() {
  return (
    <AppShell.Footer>
      <Group h="100%" px="md" justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {`© 2025 YediHilal Yönetim Sistemi. Tüm hakları saklıdır. <selcuk.ari/>`}
        </Text>
        <Group gap="md">
          <Text
            size="sm"
            c="dimmed"
            component="a"
            href="#"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Gizlilik Politikası
          </Text>
          <Text
            size="sm"
            c="dimmed"
            component="a"
            href="#"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Kullanım Şartları
          </Text>
          <Text
            size="sm"
            c="dimmed"
            component="a"
            href="#"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Destek
          </Text>
        </Group>
      </Group>
    </AppShell.Footer>
  );
}
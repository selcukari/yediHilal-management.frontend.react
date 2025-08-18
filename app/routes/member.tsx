import React from 'react';
import {
  Container, Grid,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
} from '@mantine/core';
import { Country, Area, Province } from '../components'

export default function Member() {

  return (
      <Container size="xl">
        <Stack gap="lg">
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Home Page</Title>
              <Text size="sm" c="dimmed">
                Hoş geldiniz! Burada Home Page sayfası içeriği görüntüleniyor.
              </Text>
            </div>
            <Button variant="filled">Yeni Ekle</Button>
          </Group>

          {/* İçerik Kartları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <Paper shadow="xs" p="lg" withBorder>
              <Grid>
                <Grid.Col span={4}>
                  <Country isRequired={true}/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Area/>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Province/>
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son İşlemler</Title>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        ID
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        İsim
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Durum
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Tarih
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((item) => (
                      <tr key={item} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '12px' }}>{item}</td>
                        <td style={{ padding: '12px' }}>Örnek İtem {item}</td>
                        <td style={{ padding: '12px' }}>
                          <Text size="sm" c="green">
                            Aktif
                          </Text>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Text size="sm" c="dimmed">
                            2025-01-15
                          </Text>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Group gap="xs">
                            <Button size="xs" variant="light">
                              Düzenle
                            </Button>
                            <Button size="xs" variant="light" color="red">
                              Sil
                            </Button>
                          </Group>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Stack>
          </Paper>
        </Stack>
      </Container>
  );
}
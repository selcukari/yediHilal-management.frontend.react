import { useState, useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Grid, TextInput, Stack, Group, Title, Text, Paper, Table, LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMailService } from '../../services/mailService';
import { formatDate } from '../../utils/formatDate';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { stripHtml } from '../../utils/stripHtml';
import { useAuthStore } from '~/authContext';

interface Column {
  field: keyof Mail;
  header: string;
}

interface Mail {
  id: string | number;
  subject: string;
  body: string;
  count: number;
  toUsers: string;
  toEmails: string;
  createdDate: string;
}

interface RawMail {
  id: string | number;
  subject: string;
  body: string;
  count: number;
  toUsers: string;
  toEmails: string;
  createdDate: string;
}

export default function Mail() {
  const [searchText, setSearchText] = useState<string>('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'subject', header: 'Konu' },
    { field: 'body', header: 'İçerik' },
    { field: 'count', header: 'Alıcı Sayısı' },
    { field: 'toUsers', header: 'Alıcı İsimleri' },
    { field: 'toEmails', header: 'Alıcı E-Postaları' },
    { field: 'createdDate', header: 'Gönderim Tarihi' },
  ]);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const service = useMailService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const { data: resultData = [], isLoading, isError } = useQuery<Mail[]>({
    queryKey: ["mails"],
    queryFn: async () => {
      const params: number = 2; // 1: user, 2: member

      const response = await service.getMails(params);

      return (response ?? []).map((mail: RawMail) => ({
        id: mail.id,
        subject: mail.subject,
        toEmails: mail.toEmails,
        toUsers: mail.toUsers,
        body: stripHtml(mail.body as string),
        count: mail.count,
        createdDate: formatDate(mail.createdDate, dateFormatStrings.dateTimeFormatWithoutSecond),
      }));
    },
    enabled: !!isLoggedIn,
    initialData: !isLoggedIn ? [] : undefined,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
  });

    // Filtrelenmiş veriler
  const filteredUsers = useMemo<Mail[]>(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(mail =>
      mail.subject.toLowerCase().includes(searchText.trim().toLowerCase()) ||
      mail.body.toLowerCase().includes(searchText.trim().toLowerCase())
    );
  }, [resultData, searchText]);

    const rowsTable = filteredUsers.map((item: Mail) => (
    <Table.Tr key={item.id}>
      {rowHeaders.map((header) => {
     
        if (header.field === 'subject') {
          return (
            <Table.Td key={header.field}>
              {item["subject"].length > 30 ? `${item["subject"].substring(0,30)}...`: item["subject"]}
            </Table.Td>
          );
        }
        if (header.field === 'body') {
          return (
            <Table.Td key={header.field}>
              {item["body"].length > 25 ? `${item["body"].substring(0,25)}...`: item["body"]}
            </Table.Td>
          );
        }
        if (header.field === 'toEmails' || header.field === 'toUsers') {
          return (
            <Table.Td key={header.field}>
              {item[header.field].length > 30 ? `${item[header.field].substring(0,30)}...`: item[header.field]}
            </Table.Td>
          );
        }

        return (
          <Table.Td key={header.field}>
            {item[header.field] || '-'}
          </Table.Td>
        );
      })}
    </Table.Tr>
  ));

  return (
      <Container size="xl">
        <LoadingOverlay
          visible={visible}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'pink', type: 'bars' }}
        />
        <Stack gap="lg">
          {/* Sayfa Başlığı */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Mail Sayfası</Title>
              <Text size="sm" c="dimmed">
                Toolbar Filtreleme Alanı
              </Text>
            </div>
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

                <Grid.Col span={{ base: 12, sm: 6, md: 4}}>
                  <TextInput
                    label="Konu veya içerik Ara"
                    placeholder="text giriniz"
                    leftSection={<IconSearch size={18} />}
                    value={searchText}
                    onChange={(event) => setSearchText(event.currentTarget.value)}
                  />
                </Grid.Col>

              </Grid>
            </Paper>
          </div>

          {/* Örnek Tablo */}
          <Paper shadow="xs" p="lg" withBorder>
            <Stack gap="md">
              <Title order={4}>Son Mailler({rowsTable?.length || 0})</Title>
              <Table.ScrollContainer minWidth={400} maxHeight={700}>
                <Table striped highlightOnHover withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      {rowHeaders.map((header) => (
                        <Table.Th key={header.field}>{header.header}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rowsTable}</Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>
        </Stack>
      </Container>
  );
}
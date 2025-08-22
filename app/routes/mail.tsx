import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Stack, Group, Title, Text, Paper, Table, LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMailService } from '../services/mailService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '~/authContext';

interface Column {
  field: string;
  header: string;
}

export default function Mail() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'id' },
    { field: 'subject', header: 'Konu' },
    { field: 'body', header: 'İçerik' },
    { field: 'count', header: 'Alıcı Sayısı' },
    { field: 'toUsers', header: 'Alıcı İsimleri' },
    { field: 'toEmails', header: 'Alıcı E-Postaları' },
    { field: 'createdDate', header: 'Gönderim Tarihi' },
  ]);

  const { isLoggedIn } = useAuth();

  const service = useMailService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(mail =>
      mail.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      mail.body.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [resultData, searchText]);

  useEffect(() => {
    if (isLoggedIn) {
      setTimeout(() => {
        fetchMails();
      }, 1000);
    }
  }, []);



  const rowsTable = filteredUsers.map((item) => (
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
              {item[header.field].length > 50 ? `${item[header.field].substring(0,50)}...`: item[header.field]}
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

  const fetchMails = async () => {
     open();

    const params: number = 2; // 1: user, 2: member
     try {

      const getMails = await service.getRoles(params);
      if (getMails) {
        setResultData(getMails.map((mail: any) => ({
          id: mail.id,
          subject: mail.subject,
          toEmails: mail.toEmails,
          toUsers: mail.toUsers,
          body: mail.body,
          count: mail.count,
          createdDate: formatDate(mail.createdDate),
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
      console.error('Error fetching getMails:', error.message);
        toast.error(`Mail yüklenirken hata: ${error.message}`);
      close();
    }
  };

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

                <Grid.Col span={4}>
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
              <Table.ScrollContainer minWidth={500} maxHeight={300}>
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
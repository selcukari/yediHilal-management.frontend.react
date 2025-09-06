import { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Container, Grid, TextInput, Stack, Group, Title, Text, Paper, Table, LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSmsService } from '../services/smsService';
import { toast } from '../utils/toastMessages';
import { formatDate } from '../utils/formatDate';
import { dateFormatStrings } from '../utils/dateFormatStrings';

interface Column {
  field: string;
  header: string;
}

export default function Mail() {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [visible, { open, close }] = useDisclosure(false);
  
  const [rowHeaders, setRowHeaders] = useState<Column[]>([
    { field: 'id', header: 'Id' },
    { field: 'message', header: 'Mesaj' },
    { field: 'toUsers', header: 'Alıcı İsimleri' },
    { field: 'toPhoneNumbers', header: 'Alıcı Tel. Num.' },
    { field: 'count', header: 'Alıcı Sayısı' },
    { field: 'createdDate', header: 'Gönderim Tarihi' },
  ]);

  const service = useSmsService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  // Filtrelenmiş veriler
  const filteredUsers = useMemo(() => {
    if (!searchText) return resultData;
    
    return resultData.filter(sms => sms.message.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [resultData, searchText]);

  useEffect(() => {
    setTimeout(() => {
      fetchSms();
    }, 1000);
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

  const fetchSms = async () => {
     open();

    const params: number = 2; // 1: user, 2: member
     try {

      const getSmss = await service.getSms(params);
      if (getSmss) {
        setResultData(getSmss.map((sms: any) => ({
          id: sms.id,
          message: sms.message,
          toUsers: sms.toUsers,
          toPhoneNumbers: sms.toPhoneNumbers,
          count: sms.count,
          createdDate: formatDate(sms.createdDate, dateFormatStrings.dateTimeFormatWithoutSecond),
        })));
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultData([]);
      }
        close();
    } catch (error: any) {
        toast.error(`Sms yüklenirken hata: ${error.message}`);
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
              <Title order={2}>Sms Sayfası</Title>
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
                    label="Mesaj Ara"
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
              <Title order={4}>Son Smsler({rowsTable?.length || 0})</Title>
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
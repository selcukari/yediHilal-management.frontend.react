import { forwardRef, useEffect, useMemo, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {  Modal,  Select,  Button,  Stack,  Flex,  Group,  Badge,  Table, Checkbox, ScrollArea, Text
} from '@mantine/core';
import { IconCancel, IconCheck } from '@tabler/icons-react';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { useMemberService } from '../../services/memberService';
import { usePhoneCallTrackingService } from '../../services/phoneCallTrackingService';
import { toast } from '../../utils/toastMessages';
import { dateFormatStrings } from '../../utils/dateFormatStrings';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '~/authContext';

export type PhoneCallTrackingSendDialogControllerRef = {
  open: () => void;
  close: () => void; 
};

interface MemberAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  fullName: string;
  countryCode: string;
  phone: string;
  referenceId: string;
  isActive: boolean;
  typeIds: string;
  countryId: string;
  provinceId: string;
  deleteMessageTitle?: string;
};

const PhoneCallTrackingSend = forwardRef<PhoneCallTrackingSendDialogControllerRef, MemberAddProps>(({onSaveSuccess}, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultData, setResultData] = useState<any[]>([]);
  const [resultDataPhoneCall, setResultDataPhoneCall] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [phoneCallId, setPhoneCallId] = useState<string>("");
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const { currentUser } = useAuth();

  const [rowHeaders, setRowHeaders] = useState([
    { field: 'id', header: 'Id' },
    { field: 'fullName', header: 'Ad Soyad' },
    { field: 'typeNames', header: 'Üye Tipi' },
    { field: 'phoneWithCountryCode', header: 'Telefon' },
    { field: 'referenceFullName', header: 'Referans İsmi' },
    { field: 'referencePhone', header: 'Referans Telefon' },
    { field: 'countryName', header: 'Ülke' },
    { field: 'provinceName', header: 'İl' },
    { field: 'createdDate', header: 'İlk Kayıt' },
  ]);

  const service = useMemberService(import.meta.env.VITE_APP_API_BASE_CONTROLLER);
  const servicePhoneCall = usePhoneCallTrackingService(import.meta.env.VITE_APP_API_USER_CONTROLLER);

  const isUserAdmin = useMemo(() => {
    return currentUser?.userType === 'userLogin';
  }, [currentUser]);

  const handleSubmit = async (valuesIds: number[]) => {
    // Submit logic here
    if (selectedRows.length === 0 || !phoneCallId) {
      toast.info('Lütfen en az bir üye seçiniz veya arama takip');
      return;
    }

    const selectedMemberData = resultData?.filter(i => valuesIds.includes(i.id))?.map(x => ({
      ...x, phoneCallStatudescription: "", createdDate: formatDate(new Date().toISOString(), dateFormatStrings.dateTimeFormatWithoutSecond), callStatu: ""
    }));
    const result = await servicePhoneCall.updatePhoneCallTracking({
      id: parseInt(phoneCallId),
      members: JSON.stringify(selectedMemberData ?? []),
    });

    if (result === true) {

      // Burada seçilen üyelere mesaj gönderme işlemi yapılacak
      toast.success(`${selectedRows.length} üyeye eklendi`);
      close();
    } else {
      toast.error('Bir hata oluştu!');
    }
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
  };

  const confirmDialogHandleCancel = () => {
    toast.info("İşlem iptal edildi");
  };

  const dialogClose = () => {
    setSelectedRows([]);
    close();
  }

  // Tüm satırları seç/çıkar
  const toggleAllRows = () => {
    setSelectedRows(current =>
      current.length === resultData.length ? [] : resultData.map(item => item.id)
    );
  };

  // Tekil satır seçimi
  const toggleRow = (id: number) => {
    setSelectedRows(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  };

  const fetchMembers = async () => {
    open();

    const params = {
      // bağıs, zekat, aidat,burs olanlar cek
      typeIds: "6,4,3,2",
      isActive: true,
      countryId: "1"
    }

    try {
      const getMembers = await service.members(params);
      if (getMembers) {
        setResultData(getMembers.map((item: any) => ({
          ...item,
          createdDate: formatDate(item.createdDate, dateFormatStrings.dateTimeFormatWithoutSecond),
          phoneWithCountryCode: (item.countryCode && item.phone) ? `${item.countryCode}${item.phone}` : undefined
        })));

      } else {
        toast.info('Hiçbir veri yok!');
        setResultData([]);
      }
    } catch (error: any) {
      toast.error(`Üye yüklenirken hata: ${error.message}`);
    } finally {
      close();
    }
  };

  const fetchPhoneCallTracking = async () => {
     open();

     try {
      const responsibleId = !isUserAdmin ? currentUser.id as number : undefined;

      const getphoneCallTrackings = await servicePhoneCall.getPhoneCallTrackings(responsibleId);
      if (getphoneCallTrackings) {
        setResultDataPhoneCall(getphoneCallTrackings);
       
      } else {
        toast.info('Hiçbir veri yok!');

        setResultDataPhoneCall([]);
      }
        close();

    } catch (error: any) {
        toast.error(`PhoneCallTracking yüklenirken hata: ${error.message}`);
        close();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchMembers();
      fetchPhoneCallTracking();
    }, 1000);
  }, []);

  const renderBoolean = (value: boolean) => {
     return (
       <Badge color={value ? 'green' : 'red'}>
         {value ? 'Evet' : 'Hayır'}
       </Badge>
     );
   };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  // Tablo satırlarını oluştur
  const rows = resultData.map((item) => (
    <Table.Tr
      key={item.id}
      bg={selectedRows.includes(item.id) ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={selectedRows.includes(item.id)}
          onChange={() => toggleRow(item.id)}
        />
      </Table.Td>
      {rowHeaders.map((header) => {
        if (header.field === 'isSms' || header.field === 'isMail') {
          return (
            <Table.Td key={header.field}>
              {renderBoolean(item[header.field])}
            </Table.Td>
          );
        }

        return (<Table.Td key={header.field}>
          {item[header.field]?.toString() || '-'}
        </Table.Td>);
      })}
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={opened}
        onClose={dialogClose}
        title="Arama Takip Gönder"
        centered
        size="xxl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack>
          <Flex
            mih={50}
            gap="md"
            justify="flex-start"
            align="flex-end"
            direction="row"
            wrap="wrap"
          >
          <Select
            label="Telefon Arama Takip"
            placeholder="arama Seçiniz"
            data={resultDataPhoneCall.map(item => ({ value: item.id.toString(), label: item.name }))}
            searchable clearable required maxDropdownHeight={200} nothingFoundMessage="arama bulunamadı..."
            onChange={(value) => setPhoneCallId(value ?? "")}
          />
          </Flex>
          <Group justify="space-between">
            <Text fw={500}>
              Seçilen Üyeler: {selectedRows.length} / {resultData.length}
            </Text>
            <Button 
              variant="light" 
              onClick={toggleAllRows}
              disabled={resultData.length === 0}
            >
              {selectedRows.length === resultData.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </Button>
          </Group>

          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '40px' }}>
                    <Checkbox
                      aria-label="Select all rows"
                      checked={selectedRows.length === resultData.length && resultData.length > 0}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < resultData.length}
                      onChange={toggleAllRows}
                      disabled={resultData.length === 0}
                    />
                  </Table.Th>
                  {rowHeaders.map((header) => (
                    <Table.Th key={header.field}>{header.header}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={rowHeaders.length + 1} style={{ textAlign: 'center' }}>
                      Veri bulunamadı
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          <Group justify="flex-end" mt="md">
            <Button 
              variant="outline" 
              onClick={dialogClose}
              leftSection={<IconCancel size={16} />}
            >
              İptal
            </Button>
            <Button 
              onClick={() => handleSubmit(selectedRows)}
              leftSection={<IconCheck size={16} />}
              disabled={selectedRows.length === 0}
            >
              Gönder ({selectedRows.length})
            </Button>
          </Group>
        </Stack>
      </Modal>
      
      {/* Confirm Dialog */}
      <ConfirmModal 
        ref={confirmModalRef}
        onConfirm={confirmDialogHandleConfirm}
        onCancel={confirmDialogHandleCancel}
      />
    </>
  );
});

export default PhoneCallTrackingSend;
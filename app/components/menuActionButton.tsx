import { useRef } from 'react';
import { Menu, Button, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconFileTypePdf, IconMessage, IconSend2, IconFileExcel } from '@tabler/icons-react';
import { type PdfConfig, type PdfTableColumn, PdfHelperService } from '../utils/repor/exportToPdf';
import { type ColumnDefinition, exportToExcel } from '../utils/repor/exportToExcel';
import { useMailService } from '~/services/mailService';
import MailSend, { type MailSendDialogControllerRef } from '../components/mail/mailSend';

export type MenuActionButtonRef = {
  open: () => void;
  close: () => void;
};

export interface MenuActionButtonProps {
  menuTitle?: string;
  reportTitle?: string;
  pdfColumns?: PdfTableColumn[];
  excelColumns?: ColumnDefinition[];
  valueData?: ValueData[];
  type?: number;
}

export interface ValueData {
  [key: string]: any;
}

export function MenuActionButton({
  menuTitle = "Aksiyonlar", 
  reportTitle = "", 
  pdfColumns = [],
  excelColumns = [],
  valueData = [],
  type,
}: MenuActionButtonProps) {
  const pdfHelperService = new PdfHelperService();
  const [visible, { open, close }] = useDisclosure(false);

  const mailSendRef = useRef<MailSendDialogControllerRef>(null);
  
  const mailService = useMailService(import.meta.env.VITE_APP_API_USE_CONTROLLER);


  const exportPdf = () => {
    open();

    const config: PdfConfig = {
      title: `YediHilal ${reportTitle}`,
      fileName: `yediHilal-` + reportTitle.toLocaleLowerCase().replace(/\//g,'-').replace(/ /g, '-') + '.pdf',
      pageSize: 'a4',
      orientation: 'landscape',
      showCreationDate: true,
      showPagination: true,
      headerColor: '#3498db', // Mavi
      alternateRowColor: '#f8f9fa', // Açık gri
      textColor: '#2c3e50' // Koyu gri
    };

    pdfHelperService.generatePdf(valueData, pdfColumns, config);
    close();
  };

  const exportExcel = () => {
    open();
    exportToExcel(valueData, excelColumns, `yediHilal-${reportTitle.toLocaleLowerCase().replace(/\//g,'-').replace(/ /g, '-')}`);
    close();
  };

  const sendMail = () => {
    const newUserData = valueData?.filter(value => value.isMail && value.email) || []

    mailSendRef.current?.openDialog({
      toUsers: newUserData.map(value => value.fullName),
      toEmails: newUserData.map(value => value.email), type: 2,
   });

  };
  const sendSms = () => {
    open();
    console.log('Sms gönderme işlemi tetiklendi');
    close();
  };

  return (<>
    <LoadingOverlay
      visible={visible}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ color: 'pink', type: 'bars' }}
    />
    <Menu disabled={valueData.length < 1} shadow="md" width={200}>
      <Menu.Target>
        <Button>{menuTitle}</Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconFileTypePdf size={14} />}
          onClick={exportPdf}
        >Rapor-Pdf</Menu.Item>
        <Menu.Item
          leftSection={<IconFileExcel size={14} />}
          onClick={exportExcel}
        >Rapor-Excel</Menu.Item>
        <Menu.Item
          leftSection={<IconSearch size={14} />}
          disabled
        >
          Search
        </Menu.Item>
        <Menu.Item leftSection={<IconSend2 size={14} />} onClick={sendMail}>Mail-Gönder</Menu.Item>
        <Menu.Item leftSection={<IconMessage size={14} />} onClick={sendSms}>Sms-Gönder</Menu.Item> 
      </Menu.Dropdown>
    </Menu>
    <MailSend ref={mailSendRef} />
  </>);
};
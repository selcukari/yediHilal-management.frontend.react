import { useRef } from 'react';
import { Menu, Button, LoadingOverlay, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileTypePdf, IconMessage, IconSend2, IconFileExcel, IconBrandWhatsapp } from '@tabler/icons-react';
import { type PdfConfig, type PdfTableColumn, PdfHelperService } from '../utils/repor/exportToPdf';
import { type ColumnDefinition, exportToExcel } from '../utils/repor/exportToExcel';
import MailSend, { type MailSendDialogControllerRef } from '../components/mail/mailSend';
import SmsSend, { type SmsSendDialogControllerRef } from '../components/sms/smsSend';

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
  isSmsDisabled?: boolean;
  isMailDisabled?: boolean;
  isWhatsAppDisabled?: boolean;
}

export interface ValueData {
  [key: string]: any;
}

export function MenuActionButton({
  menuTitle = "Aksiyonlar", 
  reportTitle = "",
  isSmsDisabled = false,
  isMailDisabled = false,
  isWhatsAppDisabled = false,
  pdfColumns = [],
  excelColumns = [],
  valueData = [],
  type,
}: MenuActionButtonProps) {
  const pdfHelperService = new PdfHelperService();
  const [visible, { open, close }] = useDisclosure(false);

  const mailSendRef = useRef<MailSendDialogControllerRef>(null);
  const smsSendRef = useRef<SmsSendDialogControllerRef>(null);
  
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

    const newData = valueData?.map(item =>({
      ...item,
      isSms: item.isSms ? 'Evet' : 'Hayır',
      isMail: item.isMail ? 'Evet' : 'Hayır',
    }));

    pdfHelperService.generatePdf(newData, pdfColumns, config);
    close();
  };

  const exportExcel = () => {
    open();
    const newData = valueData?.map(item =>({
      ...item,
      isSms: item.isSms ? 'Evet' : 'Hayır',
      isMail: item.isMail ? 'Evet' : 'Hayır',
    }));
    exportToExcel(newData, excelColumns, `yediHilal-${reportTitle.toLocaleLowerCase().replace(/\//g,'-').replace(/ /g, '-')}`);
    close();
  };

  const sendMail = () => {
    const newUserData = valueData?.filter(value => value.isMail && value.email) || []

    mailSendRef.current?.openDialog({
      toUsers: newUserData.map(value => value.fullName),
      toEmails: newUserData.map(value => value.email), type: 2, count: newUserData.length || 0
   });

  };
  const sendSms = (smsType: string) => { // sms/whatsApp gönderme işlemi burada phone ulke kodu ile birlikte olabilir
    const newUserData = valueData?.filter(value => value.isSms && value.phone) || []

    smsSendRef.current?.openDialog(smsType, {
      toUsers: newUserData.map(value => value.fullName), toCountryCodes: newUserData.map(value => value.countryCode),
      toPhoneNumbers: newUserData.map(value => value.phone), personType: 2, count: newUserData.length || 0
   });
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
        <Menu.Item leftSection={<IconFileTypePdf size={14} />} onClick={exportPdf} >Rapor-Pdf</Menu.Item>
        <Menu.Item leftSection={<IconFileExcel size={14} />} onClick={exportExcel} >Rapor-Excel</Menu.Item>
        <Divider my="md" />
        <Menu.Item leftSection={<IconSend2 size={14} />} onClick={sendMail}disabled={isMailDisabled}>Mail-Gönder</Menu.Item>
        <Menu.Item leftSection={<IconMessage size={14} />} onClick={() => sendSms("sms")} disabled={isSmsDisabled}>Sms-Gönder</Menu.Item> 
        <Menu.Item leftSection={<IconBrandWhatsapp size={14} />} onClick={() => sendSms("whatsApp")} disabled={isWhatsAppDisabled}>WhatsApp-Gönder</Menu.Item> 
      </Menu.Dropdown>
    </Menu>
    <MailSend ref={mailSendRef} />
    <SmsSend ref={smsSendRef} />
  </>);
};
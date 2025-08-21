import { Menu, Button } from '@mantine/core';
import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { IconSearch, IconFileTypePdf, IconFileExcel } from '@tabler/icons-react';
import { type PdfConfig, type PdfTableColumn, PdfHelperService } from '../utils/repor/exportToPdf';
import { type ColumnDefinition } from '../utils/repor/exportToExcel';

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

  const exportPdf = () => {
    console.log('Exporting PDF with columns:', pdfColumns, 'and data:', valueData);
    console.log('Exporting PDF with reportTitle:', reportTitle);

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
  };

  const exportExcel = () => {
    console.log('ExportexportExcel with columns:', excelColumns, 'and data:', valueData);
  };

  return (
    <Menu>
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
        <Menu.Item>Dashboard3</Menu.Item>
        <Menu.Item>Dashboard4</Menu.Item>

       
      </Menu.Dropdown>
    </Menu>
  );
};
import * as XLSX from 'xlsx';

export interface ValueData {
  id: number;
  fullName: string;
  identificationNumber?: string;
  telephone: string;
	dateOfBirth?: number;
  email: string;
  countryCode?: string;
  createdDate: string;
  updateDate?: string;
  countryName: string;
  provinceName: string;
  isSms?: boolean;
  isMail?: boolean;
  areaName: string;
	roleName?: string;
}

export interface ColumnDefinition {
  key: keyof ValueData;
  header: string;
  format?: (value: any) => string | number | boolean;
}

export function exportToExcel(
  data: ValueData[],
  columns: ColumnDefinition[],
  fileName: string = 'yedihilal'
) {
  // Format the data according to column definitions
  const formattedData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      const value = item[col.key];
      row[col.header] = col.format ? col.format(value) : value;
    });
    return row;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

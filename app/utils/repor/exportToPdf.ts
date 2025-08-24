import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Font dosyalarını base64 olarak import et
import RobotoRegular from '../../assets/fonts/roboto/Roboto-Regular.ttf';
import RobotoBold from '../../assets/fonts/roboto/Roboto-Bold.ttf';
import RobotoItalic from '../../assets/fonts/roboto/Roboto-Italic.ttf';
import RobotoBoldItalic from '../../assets/fonts/roboto/Roboto-BoldItalic.ttf';

// Türkçe karakter desteği için font dosyası
// Bu font dosyasını assets/fonts/ klasörüne eklemeniz gerekir
declare const require: any;

export interface PdfConfig {
  title: string;
  fileName?: string;
  pageSize?: 'a4' | 'a3' | 'letter';
  orientation?: 'portrait' | 'landscape';
  showCreationDate?: boolean;
  showPagination?: boolean;
  headerColor?: string;
  alternateRowColor?: string;
  textColor?: string;
}

export interface PdfTableColumn {
  key: string;
  title: string;
  width?: number;
}

export class PdfHelperService {

  /**
   * PDF oluşturan ana fonksiyon
   * @param data - Tablo verisi
   * @param columns - Tablo sütunları
   * @param config - PDF konfigürasyonu
   */
  public generatePdf<T>(
    data: T[],
    columns: PdfTableColumn[],
    config: PdfConfig
  ): void {

    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: config.pageSize || 'a4',
      filters: ['ASCIIHexEncode'],
      compress: true
    });

    // doc.useUnicode(true); // Removed: jsPDF does not have useUnicode method

    // Türkçe karakter desteği için font ayarları
    this.setupTurkishFont(doc);

    // Sayfa boyutlarını al
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Başlık ekle
    this.addTitle(doc, config.title, pageWidth);

    // Oluşturulma tarihi ekle
    if (config.showCreationDate !== false) {
      this.addCreationDate(doc, pageWidth);
    }

    // Tablo verilerini hazırla
    const tableData = this.prepareTableData(data, columns);
    const tableHeaders = columns.map(col => col.title);

    // Tabloyu ekle
    this.addTable(doc, tableHeaders, tableData, config, columns);

    // Sayfalama ekle
    if (config.showPagination !== false) {
      this.addPagination(doc);
    }

    // PDF'i kaydet
    const fileName = config.fileName || `${config.title.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }

  /**
   * Türkçe karakter desteği için font ayarları
   */
  private setupTurkishFont(doc: jsPDF): void {
    try {
    // Tüm font varyasyonlarını ekleyin
    doc.addFont(RobotoRegular, 'Roboto', 'normal');
    doc.addFont(RobotoBold, 'Roboto', 'bold');
    doc.addFont(RobotoItalic, 'Roboto', 'italic');
    doc.addFont(RobotoBoldItalic, 'Roboto', 'bolditalic');

    // Unicode desteğini etkinleştirin
    doc.setFont('Roboto', 'normal');
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
  } catch (error) {
    console.error('Font yükleme hatası:', error);
  }
  }

  /**
   * Başlık ekle
   */
  private addTitle(doc: jsPDF, title: string, pageWidth: number): void {
    doc.setFontSize(16);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(44, 62, 80); // Koyu mavi

    // Türkçe karakterler için encoding ayarı
    const encodedTitle = this.encodeTurkish(title);
    const titleWidth = doc.getTextWidth(encodedTitle);
    const titleX = (pageWidth - titleWidth) / 2;

    doc.text(encodedTitle, titleX, 20);
  }

  /**
   * Oluşturulma tarihi ekle
   */
  private addCreationDate(doc: jsPDF, pageWidth: number): void {
    const now = new Date();
    const dateString = `Tarih: ${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}`;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gri

    const encodedDate = this.encodeTurkish(dateString);
    const dateWidth = doc.getTextWidth(encodedDate);
    const dateX = (pageWidth - dateWidth) / 2;

    doc.text(encodedDate, dateX, 30);
  }

  /**
   * Tablo verilerini hazırla
   */
  private prepareTableData<T>(data: T[], columns: PdfTableColumn[]): string[][] {
    return data.map(item =>
      columns.map(col => {
        const value = (item as any)[col.key];
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        return this.encodeTurkish(stringValue);
      })
    );
  }

  /**
   * Tabloyu ekle
   */
private addTable(
  doc: jsPDF,
  headers: string[],
  data: string[][],
  config: PdfConfig,
  columns: PdfTableColumn[]
): void {
  // Sütun genişliklerini hesapla
  const columnStyles: { [key: number]: any } = {};
  columns.forEach((col, index) => {
    if (col.width) {
      columnStyles[index] = { cellWidth: col.width };
    }
  });

  autoTable(doc, {
    head: [headers.map(h => this.encodeTurkish(h))],
    body: data,
    startY: 35, // Tablonun başlangıç pozisyonu
    tableWidth: 'auto', // Tablo genişliği ayarı
    willDrawCell: (data: any) => {
     if (data.section === 'body') {
        if (data.cell.raw === 'Evet') {
          doc.setTextColor(0, 128, 0); // Yeşil
        } else if (data.cell.raw === 'Hayir') {
          doc.setTextColor(255, 0, 0); // Kırmızı
        }
    }
    },
    margin: {
      top: 35,
      left: 0,
      right: 10,
      bottom: 20
    },
    styles: {
      font: 'Roboto',
      fontStyle: 'normal',
      fontSize: 9, // Yazı boyutunu küçült
      cellPadding: 3, // Hücre içi boşluğu azalt
      textColor: config.textColor ? this.hexToRgb(config.textColor) : [44, 44, 44],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      halign: 'left',
      valign: 'middle'
    },
    headStyles: {
      fillColor: config.headerColor ? this.hexToRgb(config.headerColor) : [52, 152, 219],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10, // Başlık yazı boyutu
      halign: 'center',
      font: 'Roboto',
      cellPadding: 4, // Başlık hücre içi boşluğu
      minCellHeight: 8 // Başlık minimum yüksekliği
    },
    bodyStyles: {
      cellPadding: 3, // Gövde hücre içi boşluğu
      minCellHeight: 7, // Gövde minimum yüksekliği
    },
    alternateRowStyles: {
      fillColor: config.alternateRowColor ? this.hexToRgb(config.alternateRowColor) : [245, 245, 245]
    },
    columnStyles: columnStyles,
    // Tablonun sayfaya sığması için otomatik ölçeklendirme
    tableLineWidth: 0.1,
    tableLineColor: [200, 200, 200]
  });
}

  /**
   * Sayfalama ekle
   */
  private addPagination(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages() || 1;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Sayfa numarası
      const pageText = `Sayfa ${i} / ${pageCount}`;
      const encodedPageText = this.encodeTurkish(pageText);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const textWidth = doc.getTextWidth(encodedPageText);

      doc.text(encodedPageText, pageWidth - textWidth - 15, pageHeight - 10);
    }
  }

  /**
   * Türkçe karakter encoding işlemi
   * jsPDF'in Türkçe karakterleri doğru gösterebilmesi için
   */
  private encodeTurkish(text: string): string {
    if (!text) return '';

 const charMap: {[key: string]: string} = {
    'ı': 'i', 'İ': 'I',
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C',
    'â': 'a', 'Â': 'A',
    'î': 'i', 'Î': 'I',
    'û': 'u', 'Û': 'U'
  };

  // Özel karakterleri dönüştür
  return text.split('').map(char => {
    // Unicode normalizasyonu uygula
    const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return charMap[normalized] || char;
  }).join('');
  }

  /**
   * Hex renk kodunu RGB'ye çevir
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
}

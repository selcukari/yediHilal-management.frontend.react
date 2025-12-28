import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../formatDate';
import { dateFormatStrings } from '../dateFormatStrings';
import RobotoRegular from '../../assets/fonts/roboto/Roboto-Regular.ttf';
import RobotoBold from '../../assets/fonts/roboto/Roboto-Bold.ttf';

export interface RequestStockManagerDataPdf {
  name: string;
  updateUserFullName: string;
  productNameWithCount: string;
  status: string;
  note?: string;
  managerUserFullName: string;
  description?: string;
  managerNote?: string;
  requestDate?: string;
  approvedDate?: string;
}

// HTML'i düz metne çeviren yardımcı fonksiyon
const convertHtmlToPlainText = (html: string): string => {
  if (!html) return '';
  
  // Geçici bir div elementi oluştur
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // HTML etiketlerini işle
  // <br>, <p>, <div> etiketleri için satır sonları ekle
  tempDiv.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });
  
  tempDiv.querySelectorAll('p, div, li').forEach(element => {
    element.innerHTML = element.innerHTML + '\n';
  });
  
  // Liste öğeleri için bullet ekle
  tempDiv.querySelectorAll('li').forEach((li, index) => {
    const text = li.textContent || '';
    li.textContent = `• ${text}`;
  });
  
  // Metni al ve fazla boşlukları temizle
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Fazla satır sonlarını temizle
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
};

export const generateMeetingPdf = (meeting: RequestStockManagerDataPdf): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Font ayarları
  try {
    doc.addFont(RobotoRegular, 'Roboto', 'normal');
    doc.addFont(RobotoBold, 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
  } catch (error) {
    console.error('Font yükleme hatası:', error);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  // Başlık - Toplantı Adı (Ortalanmış)
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(44, 62, 80);
  const titleText = meeting.name;
  const titleWidth = doc.getTextWidth(titleText);
  const titleX = (pageWidth - titleWidth) / 2;
  doc.text(titleText, titleX, yPosition);
  yPosition += 15;

  // Toplantı Bilgileri Tablosu
  const meetingInfo = [
    ['Talep Eden', meeting.updateUserFullName || '-'],
    ['Ürün/Adet', meeting.productNameWithCount || '-'],
    ['Durum', meeting.status || '-'],
    ['Açıklama', meeting.description || '-'],
    ['Genel Not', meeting.note || '-'],
    ['Yönetici', meeting.managerUserFullName || '-'],
    ['Yönetici Notu', meeting.managerNote || '-'],
    ['Talep Tarihi', meeting.requestDate || '-'],
    ['Onaylama Tarihi', meeting.approvedDate || '-'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: meetingInfo,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 10,
      cellPadding: 4,
      textColor: [44, 44, 44],
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { 
        cellWidth: 50, 
        fontStyle: 'bold',
        fillColor: [245, 245, 245]
      },
      1: { 
        cellWidth: 'auto'
      }
    },
    margin: { left: margin, right: margin }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Oluşturulma Tarihi (Alt kısımda ortalanmış)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    const now = new Date();
    const dateString = `Oluşturulma Tarihi: ${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}`;
    
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 100, 100);
    
    const dateWidth = doc.getTextWidth(dateString);
    const dateX = (pageWidth - dateWidth) / 2;
    
    doc.text(dateString, dateX, pageHeight - 15);
    
    // Sayfa numarası
    const pageText = `Sayfa ${i} / ${pageCount}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - pageTextWidth - margin, pageHeight - 10);
  }

  // PDF'i kaydet
  const fileName = `${meeting.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

// Kullanım örneği
export const handleDownloadPdf = (meeting: RequestStockManagerDataPdf) => {
  try {
    generateMeetingPdf(meeting);
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
};
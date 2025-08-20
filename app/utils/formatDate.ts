import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (
  dateString: string | null | undefined,
  formatString: string = 'yyyy-MM-dd',
  fallback: string = '-'
): string => {
  if (!dateString) return fallback;
  
  try {
    // ISO formatındaki string'i Date objesine çevir
    const date = parseISO(dateString);
    
    // Geçerli bir tarih mi kontrol et
    if (!isValid(date)) return fallback;
    
    // yyyy-MM-dd formatına çevir
    return format(date, formatString);
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return fallback;
  }
};
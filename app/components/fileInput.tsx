import { FileInput, Group, Text, rem, Progress, Stack, Badge, ActionIcon } from '@mantine/core';
import { IconUpload, IconX, IconCheck, IconFile, IconExternalLink } from '@tabler/icons-react';
import { useState } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { toast } from '../utils/toastMessages';

interface FileUploadProps {
  form: UseFormReturnType<any>;
  required?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export function FileUpload({ form, required = false }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const handleFileChange = async (files: File[] | null) => {
    if (!files) return;

    // Sadece PDF, PNG ve JPEG dosyalarını kabul et
    const allowedTypes = ['text/plain','application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validFiles = files.filter(file => {
      console.log("file:", file)
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 20 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.warning(`${file.name} - Sadece PDF, PNG, Txt, Word, Excel, Zip ve JPEG dosyaları yüklenebilir`);
      }
      if (!isValidSize) {
        toast.warning(`${file.name} - Dosya boyutu 20MB'den küçük olmalı`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;

    // Upload progress state'ini güncelle
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(prev => [...prev, ...newUploads]);

    // Mevcut dosyaları al ve yeni dosyaları ekle
    const currentFiles = form.values.files || [];
    const updatedFiles = [...currentFiles, ...validFiles];

    // Form state'ini güncelle
    form.setFieldValue('files', updatedFiles);

    // Progress'leri başarılı olarak işaretle
    setTimeout(() => {
      setUploadProgress(prev => 
        prev.map(item => 
          validFiles.includes(item.file) 
            ? { ...item, progress: 100, status: 'success' }
            : item
        )
      );
    }, 1000);
  };

  const removeUploadingFile = (progressIndex: number) => {
    const uploadItem = uploadProgress[progressIndex];
    
    // Eğer dosya form'a eklenmişse, onu da kaldır
    if (uploadItem && uploadItem.status === 'success') {
      const currentFiles = [...(form.values.files || [])];
      const fileIndex = currentFiles.findIndex(file => file === uploadItem.file);
      if (fileIndex !== -1) {
        currentFiles.splice(fileIndex, 1);
        form.setFieldValue('files', currentFiles);
      }
    }
    
    setUploadProgress(prev => prev.filter((_, i) => i !== progressIndex));
  };

  const getFileName = (file: File) => {
    return file.name;
  };

  const getFileNameWithoutUUID = (url: string) => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const fileNameWithExtension = pathParts[pathParts.length - 1];
        const fileName = fileNameWithExtension.replace(/\.[^/.]+$/, "");
        
        // UUID'den önceki kısmı al (son _'ya kadar)
        const lastUnderscoreIndex = fileName.lastIndexOf('_');
        if (lastUnderscoreIndex !== -1) {
            return fileName.substring(0, lastUnderscoreIndex);
        }
        return fileName;
    } catch (error) {
        console.error('Geçersiz URL:', url);
        return null;
    }
  }

  return (
    <Stack gap="sm">
      <FileInput
        label="Dosya Yükle"
        description="Sadece PDF, PNG, TXT, Zip ve JPEG dosyaları yüklenebilir (Max: 10MB)"
        placeholder="Dosya seçin"
        multiple clearable 
        radius="lg"
        accept=".txt,.pdf,.png,.jpeg,.jpg,.docx,.xlsx,.zip"
        onChange={handleFileChange}
        leftSection={<IconUpload style={{ width: rem(18), height: rem(18) }} />}
        required={required}
      />

      {/* Edit yapıldıgında Form'a eklenmiş dosyaların listesi */}
      {form.values.fileUrls?.split(",")?.map((fileUrl: string, index: number) => (
        <Group key={index} justify="space-between" bg="gray.0" p="xs" style={{ borderRadius: '4px' }}>
          <Group gap="sm">
            <IconFile size={16} />
            <Text size="sm">{getFileNameWithoutUUID(fileUrl)}</Text>
            <Badge color="green" size="xs">Ekli</Badge>
          </Group>
          <ActionIcon color="blue" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
            <IconExternalLink size={14} />
          </ActionIcon>
        </Group>
      ))}

      {/* Yüklenmekte olan dosyalar */}
      {uploadProgress.map((upload, index) => (
        <Stack key={index} gap="xs" bg="gray.0" p="xs" style={{ borderRadius: '4px' }}>
          <Group justify="space-between">
            <Group gap="sm">
              <IconFile size={16} />
              <Text size="sm">{upload.file.name}</Text>
              <Badge 
                color={
                  upload.status === 'uploading' ? 'blue' : 
                  upload.status === 'success' ? 'green' : 'red'
                } 
                size="xs"
              >
                {upload.status === 'uploading' ? 'Ekleniyor' : 
                 upload.status === 'success' ? 'Başarılı' : 'Hata'}
              </Badge>
            </Group>
            <ActionIcon color="red" size="sm" onClick={() => removeUploadingFile(index)}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
          
          {upload.status === 'uploading' && (
            <Progress value={upload.progress} size="sm" />
          )}
          
          {upload.status === 'success' && (
            <Text size="xs" c="green">
              <IconCheck size={12} /> Dosya eklendi
            </Text>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
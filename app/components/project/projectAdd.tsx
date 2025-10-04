import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, TextInput, Button, Stack, Grid, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { IconCancel, IconCheck, IconCalendar } from '@tabler/icons-react';
import { isEquals } from '~/utils/isEquals';
import ConfirmModal, { type ConfirmModalRef } from '../confirmModal';
import { PrioritySelect } from '../addOrEdit/prioritySelect';
import { ResponsibleUserSelect } from '../addOrEdit/responsibleUserSelect';
import { useProjectService } from '../../services/projectService';
import { useUserService } from '../../services/userService';
import { toast } from '../../utils/toastMessages';
import { RichTextEditorTiptap } from '../richTextEditorTiptap';
import { FileUpload } from '../fileInput';
import { DayRenderer } from '../../components';

export type ProjectAddDialogControllerRef = {
  open: () => void;
  close: () => void;
};

interface UserAddProps {
  onSaveSuccess?: () => void; // Yeni prop
}

type FormValues = {
  name: string;
  responsibleId?: string | null;
  responsibleFullName?: string | null;
  numberOfParticipant: number;
  note: string;
  priority: string;
  finisDate?: string | null;
  budget?: number;
  files?: any[]; // Yeni alan: Google Drive URL'leri
};

const ProjectAdd = forwardRef<ProjectAddDialogControllerRef, UserAddProps>(({onSaveSuccess}, ref) => {
  const [isDisabledSubmit, setIsDisabledSubmit] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  
  const service = useProjectService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const serviceUser = useUserService(import.meta.env.VITE_APP_API_USER_CONTROLLER);
  const confirmModalRef = useRef<ConfirmModalRef>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      responsibleId: '',
      responsibleFullName: '',
      numberOfParticipant: 10,
      note: '',
      priority: '',
      budget: undefined,
      files: [],
    },
    validate: {
      name: (value) => (value.trim().length < 5 ? 'Proje başlık en az 5 karakter olmalı' : null),
      responsibleId: (value) => (value ? null : 'Sorumlu kişi alanı zorunlu'),
      numberOfParticipant: (value) => (value >= 10 ? null : 'Katılıncı sayısı en az 10 olmalı'),
      priority: (value) => (value ? null : 'Öncelik alanı zorunlu'),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsDisabledSubmit(true);
    
    try {
      // Dosya form değerlerinden al
      const files = form.values.files || [];

      const getUser = await serviceUser.user(parseInt(values.responsibleId ?? "1"));

      // Proje verilerini hazırla (dosya bilgilerini de ekle)
      const projectData = {
        ...values,
        name: values.name.trim(),
        ...(values.finisDate ? { finisDate: new Date(values.finisDate).toISOString()} : {}),
        responsibleFullName: getUser?.fullName ? getUser.fullName : undefined,
        responsibleId: values.responsibleId?.toString(),
        budget: values.budget?.toString(),
        files: files.length > 0 ? files : undefined,
      };

      const result = await service.addProject(projectData);

      if (result === true) {
        toast.success('Proje başarıyla eklendi!');
        
        // onSaveSuccess event'ini tetikle
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        close();
        form.reset();
        setIsDisabledSubmit(false);
        return;
      }
      
      if (result?.data === false && result?.errors?.length > 0) {
        toast.warning(result.errors[0]);
      } else {
        toast.error('Proje eklenirken bir hata oluştu!');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('İşlem sırasında bir hata oluştu!');
    } finally {
      setIsDisabledSubmit(false);
    }
  };

  const confirmDialogHandleConfirm = () => {
    confirmModalRef.current?.close();
    close();
    form.reset();
  };

  const confirmDialogHandleCancel = () => {
    console.log('İşlem iptal edildi');
  };

  const dialogClose = () => {
     if (!isEquals(form.getInitialValues(), form.getValues())) {
      confirmModalRef.current?.open();
    } else {
      // Eğer form boşsa direkt kapat
      close();
      form.reset();
    }
  }

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (<>
    <Modal
      opened={opened}
      onClose={() => {
        dialogClose();
      }}
      title="Yeni Proje Ekle"
      centered
      size="700"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Proje Adı"
                placeholder="başlık giriniz"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Katılımcı Sayısı"
              placeholder="sayı giriniz"
              type='number'
              {...form.getInputProps('numberOfParticipant')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <PrioritySelect
              required={true}
              form={form} 
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <ResponsibleUserSelect
              required={true}
              form={form}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Ayrılan Bütçe"
              placeholder="bütçe giriniz(₺)"
              type='number'
              {...form.getInputProps('budget')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateTimePicker dropdownType="modal" label="Bitiş Tarihi" placeholder="bitiş tarihi" required
              clearable leftSection={<IconCalendar size={18} stroke={1.5} />} leftSectionPointerEvents="none"
              minDate={new Date()} locale="tr" renderDay={DayRenderer}
              onChange={(value) => form.setFieldValue('finisDate', value)}
            />
          </Grid.Col>
          <Grid.Col>
            <FileUpload
                form={form}
                required={false}
              />
          </Grid.Col>
          <Grid.Col span={10}>
            <Text>Alınan Notlar</Text>
            <RichTextEditorTiptap
              form={form}
              emitVaue={"note"}
              {...form.getInputProps('note')}
            />
          </Grid.Col>
          <Grid.Col span={6} offset={4}>
            <Button variant="filled" size="xs" radius="xs" mr={2} onClick={dialogClose} leftSection={<IconCancel size={14} />}color="red">
              İptal
            </Button>
            <Button type="submit" variant="filled" size="xs" disabled={isDisabledSubmit}  leftSection={<IconCheck size={14} />} radius="xs">
              Kaydet
            </Button>
          </Grid.Col>
          </Grid>
        </Stack>
      </form>
    </Modal>
      {/* confirm Dialog */}
    <ConfirmModal 
      ref={confirmModalRef}
      onConfirm={confirmDialogHandleConfirm}
      onCancel={confirmDialogHandleCancel}
    />
  </>);
});

export default ProjectAdd;
import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { UseFormReturnType } from '@mantine/form';

import { RichTextEditor } from '@mantine/tiptap';

interface RichTextEditorTiptapProps {
  form: UseFormReturnType<any>;
  required?: boolean;
  value?: string;
  emitVaue?: string;
}

function RichTextEditorTiptap({form, required=false, value="", emitVaue = "body"}: RichTextEditorTiptapProps) {
  const [error, setError] = useState("İçerik en az 10 karakter olmalıdır.");
  const editor = useEditor({
    extensions: [StarterKit, Underline, Highlight, Placeholder.configure({ placeholder: 'içerik mesajı...' })],
    content: "",
     onUpdate: ({ editor }) => {
       const html = editor.getHTML();
       form.setFieldValue(emitVaue, html);

       // Real-time validation
      if (required) {
        const textContent = editor.getText().trim();
        if (textContent.length > 10) {
          setError('');
        } else {
          setError("İçerik en az 10 karakter olmalıdır.");
        }
      }
     },
  });

  useEffect(() => {
    if (value) {
      editor.commands.setContent(value);
    }
  }, [value]);

  return (<>
    <RichTextEditor editor={editor} variant="subtle" style={{ height: '500px' }}
      {...form.getInputProps('body')}>
      <RichTextEditor.Toolbar sticky stickyOffset="var(--docs-header-height)">
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        {/* <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup> */}

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>

      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
    {required && (
        <Text style={{ color: 'red' }}>
          {error}
        </Text>
      )}
    </>);
}

export { RichTextEditorTiptap };
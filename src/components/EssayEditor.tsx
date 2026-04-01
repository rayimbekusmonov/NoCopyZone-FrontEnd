import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align'; // Fixed to named import
import { Image } from '@tiptap/extension-image'; // Fixed to named import
import { Table } from '@tiptap/extension-table'; // Fixed to named import
import { TableRow } from '@tiptap/extension-table-row'; // Fixed to named import
import { TableCell } from '@tiptap/extension-table-cell'; // Fixed to named import
import { TableHeader } from '@tiptap/extension-table-header'; // Fixed to named import
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Quote, Minus, Undo, Redo, Table as TableIcon, Image as ImageIcon,
  Code as CodeIcon
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button type="button" onClick={onClick} disabled={disabled} title={title}
    className={`p-2 rounded-lg transition text-sm ${
      active
        ? 'bg-indigo-500/20 text-indigo-400'
        : disabled
        ? 'text-slate-600 cursor-not-allowed'
        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
    }`}>
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-slate-700 mx-1" />;

const EssayEditor: React.FC<Props> = ({ value, onChange, readOnly }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-6 text-slate-200 leading-relaxed',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src })
                ));
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
        }

        if (event.clipboardData?.getData('text/plain')) {
          event.preventDefault();
          return true;
        }

        return false;
      },
    },
  });

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        editor?.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {!readOnly && (
        <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="Ortga (Ctrl+Z)">
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="Oldinga (Ctrl+Y)">
            <Redo size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })} title="Sarlavha 1">
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })} title="Sarlavha 2">
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })} title="Sarlavha 3">
            <Heading3 size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')} title="Qalin (Ctrl+B)">
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')} title="Kursiv (Ctrl+I)">
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')} title="Tagiga chizish (Ctrl+U)">
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')} title="Ustiga chizish">
            <Strikethrough size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')} title="Kod">
            <CodeIcon size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })} title="Chapga">
            <AlignLeft size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })} title="Markazga">
            <AlignCenter size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })} title="O'ngga">
            <AlignRight size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })} title="Ikki tomonga">
            <AlignJustify size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')} title="Ro'yxat">
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')} title="Tartibli ro'yxat">
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')} title="Iqtibos">
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Gorizontal chiziq">
            <Minus size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={addTable} title="Jadval qo'shish">
            <TableIcon size={15} />
          </ToolbarButton>

          <ToolbarButton onClick={addImage} title="Lokal rasmdan qo'shish">
            <ImageIcon size={15} />
          </ToolbarButton>

          <div className="ml-auto text-xs text-slate-500 px-2">
            {editor.getText().trim().split(/\s+/).filter(Boolean).length} so'z
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {!readOnly && editor.isActive('table') && (
        <div className="flex items-center flex-wrap gap-2 px-4 py-2 border-t border-slate-800 bg-slate-900/80 text-xs">
          <span className="text-slate-400">Jadval:</span>
          <button onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-800 transition">+ Ustun (oldin)</button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-800 transition">+ Ustun (keyin)</button>
          <button onClick={() => editor.chain().focus().addRowBefore().run()}
            className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-800 transition">+ Qator (oldin)</button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()}
            className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-800 transition">+ Qator (keyin)</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()}
            className="text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-800 transition">- Ustun</button>
          <button onClick={() => editor.chain().focus().deleteRow().run()}
            className="text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-800 transition">- Qator</button>
          <button onClick={() => editor.chain().focus().deleteTable().run()}
            className="text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-800 transition">Jadvalni o'chirish</button>
        </div>
      )}
    </div>
  );
};

export default EssayEditor;
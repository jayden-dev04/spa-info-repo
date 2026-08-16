import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Minus,
  Sparkles
} from 'lucide-react'

interface FreeRichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function FreeRichEditor({ content, onChange }: FreeRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4]
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium hover:text-accent'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-border shadow-md'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-border rounded-lg overflow-hidden'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-muted/70 font-bold border border-border p-2 text-left'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 text-sm'
        }
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[420px] p-6 text-foreground font-sans leading-relaxed text-base'
      }
    }
  })

  if (!editor) {
    return (
      <div className="min-h-[420px] bg-card border border-border rounded-2xl flex items-center justify-center text-muted-foreground text-sm">
        <Sparkles className="w-5 h-5 animate-spin mr-2 text-primary" />
        <span>Đang khởi tạo trình soạn thảo miễn phí...</span>
      </div>
    )
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Nhập địa chỉ liên kết (URL):', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Nhập đường dẫn hình ảnh (Image URL):')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="w-full bg-card transition-all">
      {/* Sticky Rich Toolbar */}
      <div className="bg-muted/30 border-b border-border p-2 sm:p-2.5 flex flex-wrap items-center gap-1 text-muted-foreground">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-border">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg hover:bg-background hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg hover:bg-background hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 1 }) ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Tiêu đề chính H1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Tiêu đề mục H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 3 }) ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Tiêu đề phụ H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('bold') ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('italic') ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('underline') ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('strike') ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Gạch ngang"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('code') ? 'bg-primary text-white font-bold shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Đoạn mã (Code)"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Canh trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Canh giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Canh phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Canh đều 2 bên"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('bulletList') ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Danh sách gạch đầu dòng"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('orderedList') ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Danh sách đánh số"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('blockquote') ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Trích dẫn danh ngôn (Quote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded-lg hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            title="Đường kẻ ngang phân cách"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Media & Table */}
        <div className="flex items-center gap-0.5 pl-1">
          <button
            type="button"
            onClick={setLink}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('link') ? 'bg-primary text-white shadow-xs' : 'hover:bg-background hover:text-foreground'
            }`}
            title="Chèn liên kết (Link)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded-lg hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            title="Chèn hình ảnh"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addTable}
            className="p-2 rounded-lg hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            title="Chèn bảng dữ liệu (3x3 Table)"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Editable Area */}
      <div className="bg-card min-h-[420px]">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
        <span>Trình soạn thảo mã nguồn mở 100% Free (TipTap & MIT License)</span>
        <span>HTML Output sẵn sàng xuất bản</span>
      </div>
    </div>
  )
}

'use client'

import { useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTag = (openTag: string, closeTag: string, defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || defaultText
    const newValue = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end)
    onChange(newValue)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length)
    }, 0)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap p-2 bg-gray-50 rounded-t-lg border border-b-0 border-gray-300">
        <button
          type="button"
          onClick={() => insertTag('<strong>', '</strong>', 'bold text')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold rounded border border-gray-300 transition-colors"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertTag('<em>', '</em>', 'italic text')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm italic rounded border border-gray-300 transition-colors"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertTag('<u>', '</u>', 'underlined text')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm underline rounded border border-gray-300 transition-colors"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => insertTag('<h2>', '</h2>', 'Heading')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertTag('<p>', '</p>', 'Paragraph text')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          title="Paragraph"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => insertTag('<ul><li>', '</li></ul>', 'List item')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertTag('<ol><li>', '</li></ol>', 'List item')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => insertTag('<a href="">', '</a>', 'link text')}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          title="Link"
        >
          🔗
        </button>
      </div>
      <textarea
        ref={textareaRef}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter product description... Use the buttons above to add formatting.'}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-b-lg text-gray-900 focus:outline-none focus:border-purple-500 resize-none"
      />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-800 text-sm">
          <strong>HTML Editor:</strong> Use the formatting buttons above or type HTML directly. The content will be rendered as HTML on the product page.
        </p>
      </div>
    </div>
  )
}

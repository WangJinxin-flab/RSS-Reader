import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  language: string
  value: string
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-lg overflow-hidden my-4 border border-slate-200 dark:border-slate-700">
      <div className="absolute right-2 top-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          title={t('codeBlock.copyCode')}
          aria-label={t('codeBlock.copyCode')}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={isDark ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            backgroundColor: isDark ? '#1e1e1e' : '#f8fafc',
            minWidth: 'max-content',
          }}
          showLineNumbers
          wrapLines
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

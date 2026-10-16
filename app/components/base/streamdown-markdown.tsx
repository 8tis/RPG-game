'use client'
import type { FC } from 'react'
import React, { useMemo, useState } from 'react'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import cn from 'classnames'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

interface Segment {
  type: 'text' | 'details'
  summary?: string
  content: string
  defaultOpen?: boolean
}

// Convert <span class="t-xxx">text</span> into [text](#t-xxx) so markdown parses it into styled spans
function transformSpanClasses(text: string): string {
  if (!text)
    return ''
  // Replace <span class="...">content</span>
  let result = text.replace(
    /<span(?:\s+class=['"]?([^'">\s]+)['"]?)?>([\s\S]*?)<\/span>/gi,
    (_, cls, inner) => {
      if (cls)
        return `[${inner}](#${cls})`
      return inner
    },
  )
  // Clean up any remaining stray tags
  result = result
    .replace(/<\/?details[^>]*>/gi, '')
    .replace(/<\/?summary[^>]*>/gi, '')
  return result
}

// 提取 <think>...</think> 思考链内容
function extractThink(raw: string): { thinkContent: string | null; isThinking: boolean; remainingText: string } {
  if (!raw) return { thinkContent: null, isThinking: false, remainingText: '' }

  const thinkStart = raw.indexOf('<think>')
  if (thinkStart === -1) {
    return { thinkContent: null, isThinking: false, remainingText: raw }
  }

  const thinkEnd = raw.indexOf('</think>')
  if (thinkEnd !== -1) {
    const thinkContent = raw.slice(thinkStart + 7, thinkEnd).trim()
    const remainingText = (raw.slice(0, thinkStart) + raw.slice(thinkEnd + 8)).trim()
    return { thinkContent, isThinking: false, remainingText }
  } else {
    // 未闭合的 think 标签（通常是正在流式输出中）
    const thinkContent = raw.slice(thinkStart + 7).trim()
    const remainingText = raw.slice(0, thinkStart).trim()
    return { thinkContent, isThinking: true, remainingText }
  }
}

// Parse text into regular text segments and collapsible details blocks
function parseSegments(raw: string): Segment[] {
  if (!raw)
    return []

  // Check if content has any <details
  if (!/<details/i.test(raw))
    return [{ type: 'text', content: transformSpanClasses(raw) }]

  const segments: Segment[] = []
  // Matches either closed <details><summary>...</summary>...</details>
  // or open/streaming <details><summary>...</summary>... until end
  const detailsRegex = /<details(?:\s+([^>]*))?>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)(?:<\/details>|$)/gi

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = detailsRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = raw.slice(lastIndex, match.index).trim()
      if (textBefore)
        segments.push({ type: 'text', content: transformSpanClasses(textBefore) })
    }

    const attrs = match[1] || ''
    const summaryText = match[2].trim()
    const bodyContent = match[3].trim()
    const isOpenAttr = /open/i.test(attrs)

    segments.push({
      type: 'details',
      summary: summaryText,
      content: transformSpanClasses(bodyContent),
      defaultOpen: isOpenAttr,
    })

    lastIndex = detailsRegex.lastIndex
    if (lastIndex >= raw.length)
      break
  }

  if (lastIndex < raw.length) {
    const remaining = raw.slice(lastIndex).trim()
    if (remaining)
      segments.push({ type: 'text', content: transformSpanClasses(remaining) })
  }

  return segments
}

// 暗色折叠卡片专用高对比度组件（用于系统演算、状态栏、深度思考）
const darkStreamdownComponents = {
  p: ({ children, ...props }: any) => (
    <p className="text-gray-100 leading-relaxed my-1.5 text-sm font-normal" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="text-cyan-300 font-bold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="text-purple-300 italic" {...props}>{children}</em>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-base font-black text-cyan-300 mt-2 mb-1" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-sm font-black text-cyan-300 mt-2 mb-1" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wide mt-2 mb-1" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-5 my-1.5 space-y-1 text-gray-200 text-sm" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-5 my-1.5 space-y-1 text-gray-200 text-sm" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-gray-200 leading-relaxed text-sm" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-cyan-400 bg-cyan-950/40 px-3.5 py-2 my-2 rounded-r-lg text-cyan-100 text-sm font-medium" {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-purple-500/40 shadow-inner">
      <table className="w-full text-left text-xs border-collapse" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[#12192e] text-cyan-300 border-b border-purple-500/30 font-bold" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: any) => (
    <th className="p-2.5 text-cyan-300 font-bold border border-purple-500/20 text-xs" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="p-2.5 text-gray-100 bg-[#070b14]/80 border border-purple-500/15 text-xs font-mono" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-purple-500/15 hover:bg-purple-950/25 transition-colors" {...props}>{children}</tr>
  ),
  code: ({ children, ...props }: any) => (
    <code className="bg-black/70 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10" {...props}>{children}</code>
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-black/90 text-cyan-200 p-3 rounded-lg border border-cyan-500/30 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>
  ),
  hr: () => <hr className="border-purple-500/20 my-3" />,
  a: ({ href, children, ...props }: any) => {
    if (href && (href.startsWith('#t-') || href.startsWith('#t_'))) {
      const clsName = href.slice(1)
      return (
        <span className={`inline-block font-bold ${clsName}`}>
          {children}
        </span>
      )
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium" {...props}>
        {children}
      </a>
    )
  },
}

// Custom Collapsible Details Card (风月同款折叠面板)
const CollapsibleDetailsCard: FC<{
  summary: string
  content: string
  defaultOpen?: boolean
}> = ({ summary, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-3 rounded-xl border border-purple-500/50 bg-[#0c1222] text-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-purple-400">
      {/* 折叠栏头部 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-950/80 via-[#0f172a] to-purple-950/60 hover:from-purple-900/80 hover:to-purple-900/60 cursor-pointer select-none transition-colors border-b border-purple-500/30"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
          <span className="font-bold text-sm text-cyan-200 truncate tracking-wide">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-purple-200 font-bold bg-purple-900/80 px-2.5 py-1 rounded-md border border-purple-400/50 shadow-sm">
          <span>{isOpen ? '点击收起' : '点击展开'}</span>
          <span className={cn('transform transition-transform duration-200 text-[10px]', isOpen ? 'rotate-180' : 'rotate-0')}>
            ▼
          </span>
        </div>
      </div>

      {/* 折叠内容区域（纯净暗黑赛博风格，高对比度亮色文本） */}
      {isOpen && (
        <div className="p-4 bg-[#070b14] text-sm text-gray-100 space-y-2 border-t border-purple-500/20">
          {content ? (
            <Streamdown components={darkStreamdownComponents}>{content}</Streamdown>
          ) : (
            <div className="text-gray-400 text-xs italic">暂无内容</div>
          )}
        </div>
      )}
    </div>
  )
}

// 💭 深度思考折叠卡片（风月专属暗黑赛博风格）
const CollapsibleThinkCard: FC<{
  content: string
  isThinking?: boolean
}> = ({ content, isThinking = false }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="my-2.5 rounded-xl border border-purple-500/30 bg-[#070b16]/90 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full flex items-center justify-between px-3.5 py-2 select-none cursor-pointer bg-gradient-to-r from-purple-950/40 via-[#0d1324] to-purple-950/30 hover:from-purple-900/40 hover:to-purple-900/30 border-b border-purple-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💭</span>
          <span className="text-xs font-semibold text-purple-300 tracking-wide">
            {isThinking ? '深度思考演算中...' : '深度思考演算过程'}
          </span>
          {isThinking && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <span>{isOpen ? '收起思考' : '展开思考'}</span>
          <svg
            className={cn('w-3.5 h-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 bg-black/60 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto border-t border-purple-500/10">
          {content}
        </div>
      )}
    </div>
  )
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  const { thinkContent, isThinking, remainingText } = useMemo(() => extractThink(content || ''), [content])
  const segments = useMemo(() => parseSegments(remainingText || ''), [remainingText])

  const lightComponents = useMemo(() => ({
    p: ({ children, ...props }: any) => (
      <p className="text-gray-900 leading-relaxed my-2 text-sm font-normal" {...props}>{children}</p>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="text-purple-900 font-bold" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="text-purple-700 italic" {...props}>{children}</em>
    ),
    h1: ({ children, ...props }: any) => (
      <h1 className="text-lg font-black text-gray-900 mt-3 mb-1.5" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-base font-black text-purple-950 mt-3 mb-1.5" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-sm font-bold text-purple-900 mt-2.5 mb-1" {...props}>{children}</h3>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc pl-5 my-2 space-y-1 text-gray-900 text-sm" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-900 text-sm" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-gray-900 leading-relaxed text-sm" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-purple-600 bg-purple-50/90 px-3.5 py-2.5 my-2 rounded-r-lg text-gray-900 text-sm font-medium" {...props}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-2 rounded-lg border border-gray-200">
        <table className="w-full text-left text-xs border-collapse" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-purple-50 text-purple-950 border-b border-gray-200 font-bold" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="p-2.5 text-purple-950 font-bold border border-gray-200 text-xs" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="p-2.5 text-gray-900 bg-white border border-gray-100 text-xs" {...props}>{children}</td>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors" {...props}>{children}</tr>
    ),
    code: ({ children, ...props }: any) => (
      <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono border border-purple-200" {...props}>{children}</code>
    ),
    pre: ({ children, ...props }: any) => (
      <pre className="bg-[#0b1020] text-cyan-200 p-3 rounded-lg border border-purple-500/30 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>
    ),
    hr: () => <hr className="border-gray-200 my-3" />,
    a: ({ href, children, ...props }: any) => {
      if (href && (href.startsWith('#t-') || href.startsWith('#t_'))) {
        const clsName = href.slice(1)
        return (
          <span className={`inline-block font-bold ${clsName}`}>
            {children}
          </span>
        )
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-800 underline font-medium" {...props}>
          {children}
        </a>
      )
    },
  }), [])

  // If there are no think and no details blocks, render directly
  if (!thinkContent && segments.length === 1 && segments[0].type === 'text') {
    return (
      <div className={`streamdown-markdown ${className}`}>
        <Streamdown components={lightComponents}>{segments[0].content}</Streamdown>
      </div>
    )
  }

  return (
    <div className={`streamdown-markdown space-y-2 ${className}`}>
      {thinkContent && (
        <CollapsibleThinkCard content={thinkContent} isThinking={isThinking} />
      )}

      {segments.map((seg, idx) => {
        if (seg.type === 'details') {
          return (
            <CollapsibleDetailsCard
              key={`details-${idx}`}
              summary={seg.summary || '折叠内容'}
              content={seg.content}
              defaultOpen={seg.defaultOpen}
            />
          )
        }
        return (
          <div key={`text-${idx}`}>
            <Streamdown components={lightComponents}>{seg.content}</Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export default StreamdownMarkdown

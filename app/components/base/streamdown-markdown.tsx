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

// Custom Collapsible Details Card (风月同款折叠面板)
const CollapsibleDetailsCard: FC<{
  summary: string
  content: string
  defaultOpen?: boolean
}> = ({ summary, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const components = useMemo(() => ({
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
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
        </a>
      )
    },
  }), [])

  return (
    <div className="my-3 rounded-xl border border-purple-500/40 bg-[#0c1222]/95 text-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-purple-500/70">
      {/* 折叠栏头部 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-purple-950/50 hover:from-purple-900/70 hover:to-purple-900/50 cursor-pointer select-none transition-colors border-b border-purple-500/20"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
          <span className="font-bold text-sm text-purple-200 truncate tracking-wide">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-purple-300 font-semibold bg-purple-900/50 px-2.5 py-1 rounded-md border border-purple-400/40 shadow-sm">
          <span>{isOpen ? '点击收起' : '点击展开'}</span>
          <span className={cn('transform transition-transform duration-200 text-[10px]', isOpen ? 'rotate-180' : 'rotate-0')}>
            ▼
          </span>
        </div>
      </div>

      {/* 折叠内容区域 */}
      {isOpen && (
        <div className="p-4 bg-black/40 text-sm text-gray-200 space-y-2 border-t border-purple-500/10">
          {content ? (
            <Streamdown components={components}>{content}</Streamdown>
          ) : (
            <div className="text-gray-400 text-xs italic">暂无内容</div>
          )}
        </div>
      )}
    </div>
  )
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  const segments = useMemo(() => parseSegments(content || ''), [content])

  const components = useMemo(() => ({
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
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
        </a>
      )
    },
  }), [])

  // If there are no details blocks, render directly
  if (segments.length === 1 && segments[0].type === 'text') {
    return (
      <div className={`streamdown-markdown ${className}`}>
        <Streamdown components={components}>{segments[0].content}</Streamdown>
      </div>
    )
  }

  return (
    <div className={`streamdown-markdown space-y-2 ${className}`}>
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
            <Streamdown components={components}>{seg.content}</Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export default StreamdownMarkdown

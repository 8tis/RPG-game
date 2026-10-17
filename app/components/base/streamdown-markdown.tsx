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

// 全局深度清洗与语义化转换函数（兼容 PC 与移动端，彻底消除裸 HTML 与未解析标记）
function cleanAndTransformContent(raw: string): string {
  if (!raw)
    return ''

  let text = raw

  // 1. 去除包裹在 HTML/标签外层的代码反引号（例如 `<span class="t-gold">...</span>`）
  text = text.replace(/`\s*(<span(?:\s+class=['"][^'"]*['"])?>[\s\S]*?<\/span>)\s*`/gi, '$1')
  text = text.replace(/`\s*(<\/?(?:span|div|details|summary|p|b|i)[^>]*>)\s*`/gi, '$1')
  text = text.replace(/`\s*(\[[^\]]+\]\(#t-[a-z0-9_-]+\))\s*`/gi, '$1')

  // 2. 将 NPC 观测判定块（<div class="observe-wrap-v2">...</div> 或 observe-wrap）转换为科幻引用判定卡片
  text = text.replace(/<div(?:\s+class=['"]?observe-wrap[^'">]*['"]?)?>([\s\S]*?)<\/div>/gi, (_, inner) => {
    let trigger = '🔍 观测判定通过'
    let detail = ''

    // A. 匹配 HTML spans 结构
    const triggerMatch = inner.match(/<span(?:\s+class=['"]?secret-trigger[^'">]*['"]?)?>([\s\S]*?)<\/span>/i)
    const popupMatch = inner.match(/<span(?:\s+class=['"]?secret-popup[^'">]*['"]?)?>([\s\S]*?)<\/span>/i)

    if (triggerMatch && popupMatch) {
      trigger = triggerMatch[1].replace(/<[^>]+>/g, '').trim()
      detail = popupMatch[1].replace(/<[^>]+>/g, '').trim()
    }
    else {
      // B. 匹配可能已被部分转义的锚点格式 [trigger](#secret-trigger...) [detail](#secret-popup...)
      const trigPart = inner.split(/\(?#secret-trigger[^\)]*\)?/i)[0]
      const afterTrig = inner.split(/\(?#secret-trigger[^\)]*\)?/i)[1] || ''
      const popupPart = afterTrig.split(/\(?#secret-popup[^\)]*\)?/i)[0]

      if (afterTrig) {
        trigger = trigPart.replace(/^[\[\s]+/, '').replace(/[\]\s]+$/, '').trim()
        detail = popupPart.replace(/^[\[\s]+/, '').replace(/[\]\s]+$/, '').trim()
      }
      else {
        detail = inner.replace(/<[^>]+>/g, '').trim()
      }
    }

    // 规范化 trigger，保留纯净文本
    const cleanTrig = '🔍 ' + trigger.replace(/^[\s\[]*🔍\s*/, '').replace(/[\[\]]/g, '').trim()
    const cleanDetail = detail.replace(/^[\[\s]+|[\]\s]+$/g, '').trim()

    return `\n\n> 👁️ **[${cleanTrig}]**  \n> ${cleanDetail}\n\n`
  })

  // 清除任何游离在外的 secret-trigger / secret-popup 锚点标签
  text = text.replace(/\[([\s\S]*?)\]\(#secret-trigger[^\)]*\)/gi, '$1')
  text = text.replace(/\[([\s\S]*?)\]\(#secret-popup[^\)]*\)/gi, '$1')

  // 3. 将 <span class="t-xxx">内容</span> 转换为 Markdown 链接标记，并转义内部括号以防 CommonMark 解析断裂
  text = text.replace(
    /<span(?:\s+class=['"]?([^'">\s]+)['"]?)?>([\s\S]*?)<\/span>/gi,
    (_, cls, inner) => {
      if (cls && (cls.startsWith('t-') || cls.startsWith('t_'))) {
        const safeInner = inner.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
        return `[${safeInner}](#${cls})`
      }
      return inner
    },
  )

  // 4. 清除任何未正确闭合或残留的裸 HTML 标签，防止其直接以源代码形式泄露到界面
  text = text
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')

  return text
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
    return [{ type: 'text', content: cleanAndTransformContent(raw) }]

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
        segments.push({ type: 'text', content: cleanAndTransformContent(textBefore) })
    }

    const attrs = match[1] || ''
    const summaryText = match[2].trim()
    const bodyContent = match[3].trim()
    const isOpenAttr = /open/i.test(attrs)

    segments.push({
      type: 'details',
      summary: summaryText,
      content: cleanAndTransformContent(bodyContent),
      defaultOpen: isOpenAttr,
    })

    lastIndex = detailsRegex.lastIndex
    if (lastIndex >= raw.length)
      break
  }

  if (lastIndex < raw.length) {
    const remaining = raw.slice(lastIndex).trim()
    if (remaining)
      segments.push({ type: 'text', content: cleanAndTransformContent(remaining) })
  }

  return segments
}

// 递归提取节点内的纯文本
function extractRawText(node: any): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractRawText).join('')
  if (node && typeof node === 'object' && node.props && node.props.children) {
    return extractRawText(node.props.children)
  }
  return ''
}

// 点击选项快速填入输入框
const handleOptionClick = (text: string) => {
  if (typeof window !== 'undefined' && text) {
    const cleanText = text.replace(/^[\s•\-\*\d\.\、]+/, '').trim()
    window.dispatchEvent(new CustomEvent('insert-command', { detail: cleanText }))
  }
}

// 诸天万界·科幻修仙风格专属暗色语义渲染组件
const storyDarkComponents = {
  p: ({ children, ...props }: any) => {
    const text = extractRawText(children).trim()

    // 1. 大红色：危险与警告、认知污染、不可逆风险 (#FF3B3B)
    if (
      /^(?:警告|危险|致命|高危|【警告】|【不可逆风险】|【认知污染】)/.test(text) ||
      text.includes('认知污染') ||
      text.includes('不可逆风险') ||
      text.includes('#FF3B3B')
    ) {
      return (
        <p className="text-[#FF3B3B] font-bold text-sm sm:text-base leading-relaxed my-2.5 flex items-center gap-2" {...props}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B] inline-block shrink-0 shadow-[0_0_8px_#FF3B3B]" />
          <span>{children}</span>
        </p>
      )
    }

    // 2. 灵脉绿：已建立灵脉连接、状态激活 (#88CBAA)
    if (text.includes('已建立') || text.includes('灵脉连接') || text.includes('#88CBAA')) {
      return (
        <p className="text-[#88CBAA] font-medium text-sm sm:text-base leading-relaxed my-2.5 flex items-center gap-2" {...props}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#88CBAA] inline-block shrink-0 shadow-[0_0_8px_#88CBAA]" />
          <span>{children}</span>
        </p>
      )
    }

    // 3. 科技青：舰载核心、系统提示、能量回路 (#70D8E0)
    if (/^(?:舰载核心|系统提示|系统广播|核心回路|检测到|侦测到|【核心】|【系统】|【回路】)/.test(text)) {
      return (
        <p className="text-[#70D8E0] font-semibold text-sm sm:text-base leading-relaxed my-2" {...props}>
          {children}
        </p>
      )
    }

    // 4. 次要信息：星历、时间、地点、航行阶段 (#849396)
    if (/^(?:星历|时间|地点|航行阶段|纪元|世界线|状态码|坐标)/.test(text)) {
      return (
        <p className="text-[#849396] text-xs sm:text-sm font-normal tracking-wide my-1.5" {...props}>
          {children}
        </p>
      )
    }

    // 5. 灵金：重要对白、言灵警示、双引号重要内容 (#E3C362)
    if (/^“[^”]+”$/.test(text)) {
      return (
        <p className="text-[#E3C362] font-bold text-sm sm:text-base leading-relaxed my-2.5 tracking-wide" {...props}>
          {children}
        </p>
      )
    }

    // 6. 灵紫：道、灵识、深层异象 (#B396F2)
    if (text.includes('“道”') || text.includes('灵识') || text.includes('苏醒的“道”')) {
      return (
        <p className="text-[#B396F2] font-medium text-sm sm:text-base leading-relaxed my-2" {...props}>
          {children}
        </p>
      )
    }

    // 7. 规则说明落款（重要内容使用灵金，危险与警告使用大红色...）
    if (text.includes('重要内容使用灵金') || text.includes('危险与警告使用大红色')) {
      return (
        <p className="text-[#849396] text-xs leading-relaxed mt-4 pt-2.5 border-t border-[#343b44]/60 italic" {...props}>
          {children}
        </p>
      )
    }

    // 默认正文 (#E6ECE8 柔白)
    return (
      <p className="text-[#E6ECE8] text-[15px] sm:text-base leading-relaxed my-2.5 font-normal" {...props}>
        {children}
      </p>
    )
  },
  strong: ({ children, ...props }: any) => (
    <strong className="text-[#E3C362] font-bold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="text-[#B396F2] italic font-medium" {...props}>{children}</em>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-lg font-black text-[#70D8E0] mt-3.5 mb-1.5" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-base font-black text-[#70D8E0] mt-3 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => {
    const text = extractRawText(children)
    if (text.includes('你要如何回应') || text.includes('行动指令') || text.includes('选择')) {
      return (
        <div className="text-[#70D8E0] font-bold text-base mt-3.5 mb-1.5 flex items-center gap-2">
          <span>{children}</span>
        </div>
      )
    }
    return <h3 className="text-sm font-bold text-[#E3C362] mt-3 mb-1" {...props}>{children}</h3>
  },
  ul: ({ children, ...props }: any) => (
    <div className="my-3 p-3.5 rounded-xl border border-[#363d47] bg-[#25292f] shadow-sm">
      <ul className="space-y-1.5 list-none m-0 p-0" {...props}>{children}</ul>
    </div>
  ),
  ol: ({ children, ...props }: any) => (
    <div className="my-3 p-3.5 rounded-xl border border-[#363d47] bg-[#25292f] shadow-sm">
      <ol className="space-y-1.5 list-none m-0 p-0" {...props}>{children}</ol>
    </div>
  ),
  li: ({ children, ...props }: any) => {
    const rawText = extractRawText(children).trim()
    return (
      <li
        onClick={() => handleOptionClick(rawText)}
        className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#2c333f] cursor-pointer transition-colors group select-none text-[#E6ECE8]"
        title="点击直接填入此行动"
        {...props}
      >
        <span className="w-2 h-2 rounded-full shrink-0 mt-2 inline-block bg-[#70D8E0] group-hover:shadow-[0_0_8px_#70D8E0]" />
        <span className="leading-relaxed text-sm sm:text-base group-hover:text-white transition-colors">
          {children}
        </span>
      </li>
    )
  },
  blockquote: ({ children, ...props }: any) => {
    const rawText = extractRawText(children)
    if (rawText.includes('观测通过') || rawText.includes('观测判定') || rawText.includes('👁️') || rawText.includes('隐秘洞察') || rawText.includes('微观/规则')) {
      return (
        <div className="my-2.5 p-3 sm:p-3.5 rounded-xl border border-[#70D8E0]/40 bg-[#162026]/95 shadow-lg backdrop-blur-sm text-sm text-[#E6ECE8]">
          <div className="flex items-center gap-2 mb-2 text-[#70D8E0] font-bold text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-[#70D8E0] shadow-[0_0_8px_#70D8E0] shrink-0 animate-pulse" />
            <span>【隐秘洞察·观测判定】</span>
          </div>
          <div className="pl-3 border-l-2 border-[#70D8E0]/60 text-xs sm:text-sm text-[#E6ECE8]/95 leading-relaxed font-sans">
            {children}
          </div>
        </div>
      )
    }
    return (
      <blockquote className="border-l-4 border-[#70D8E0] bg-[#25292f]/80 px-4 py-2.5 my-3 rounded-r-xl text-[#E6ECE8] text-sm font-medium leading-relaxed" {...props}>
        {children}
      </blockquote>
    )
  },
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#343b44] shadow-inner bg-[#1a1d22]">
      <table className="w-full text-left text-xs border-collapse" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[#25292f] text-[#70D8E0] border-b border-[#343b44] font-bold" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: any) => (
    <th className="p-2.5 text-[#70D8E0] font-bold border border-[#343b44]/40 text-xs" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="p-2.5 text-[#E6ECE8] bg-[#1a1d22] border border-[#343b44]/30 text-xs font-mono" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-[#343b44]/30 hover:bg-[#25292f]/60 transition-colors" {...props}>{children}</tr>
  ),
  code: ({ children, ...props }: any) => {
    const rawText = extractRawText(children)
    // 兜底防御：若模型仍有反引号包裹 HTML 标签或链接漏入 inline code，解析为正统彩色词条 Badge
    if (/<span\s+class=["']?(t-[^"'\s>]+)["']?>([\s\S]*?)<\/span>/i.test(rawText)) {
      const match = rawText.match(/<span\s+class=["']?(t-[^"'\s>]+)["']?>([\s\S]*?)<\/span>/i)
      if (match) {
        return (
          <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-xs bg-[#25292f] border border-[#363d47] shadow-sm ${match[1]}`}>
            {match[2]}
          </span>
        )
      }
    }
    if (/\[([\s\S]*?)\]\(#(t-[a-z0-9_-]+)\)/i.test(rawText)) {
      const match = rawText.match(/\[([\s\S]*?)\]\(#(t-[a-z0-9_-]+)\)/i)
      if (match) {
        return (
          <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-xs bg-[#25292f] border border-[#363d47] shadow-sm ${match[2]}`}>
            {match[1].replace(/\\/g, '')}
          </span>
        )
      }
    }
    return (
      <code className="bg-[#25292f] text-[#E3C362] px-1.5 py-0.5 rounded text-xs font-mono border border-[#363d47]" {...props}>{children}</code>
    )
  },
  pre: ({ children, ...props }: any) => (
    <pre className="bg-[#13161c] text-[#70D8E0] p-3.5 rounded-xl border border-[#343b44] text-xs font-mono overflow-x-auto my-2.5" {...props}>{children}</pre>
  ),
  hr: () => <hr className="border-[#343b44] my-3.5" />,
  a: ({ href, children, ...props }: any) => {
    if (href && (href.startsWith('#t-') || href.startsWith('#t_'))) {
      const clsName = href.slice(1)
      return (
        <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-xs bg-[#25292f] border border-[#363d47] shadow-sm ${clsName}`}>
          {children}
        </span>
      )
    }
    if (href && (href.startsWith('#secret-trigger') || href.startsWith('#secret-popup'))) {
      return (
        <span className="text-[#70D8E0] font-bold">
          {children}
        </span>
      )
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-[#70D8E0] hover:underline font-medium" {...props}>
        {children}
      </a>
    )
  },
}

// Custom Collapsible Details Card (系统推演 / 状态栏折叠卡)
const CollapsibleDetailsCard: FC<{
  summary: string
  content: string
  defaultOpen?: boolean
}> = ({ summary, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-3 rounded-xl border border-[#343b44] bg-[#1a1d22] text-[#E6ECE8] shadow-xl overflow-hidden transition-all duration-200 hover:border-[#70D8E0]/40">
      {/* 折叠栏头部 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 bg-[#25292f] hover:bg-[#2c333f] cursor-pointer select-none transition-colors border-b border-[#363d47]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#88CBAA] shadow-[0_0_8px_#88CBAA] shrink-0" />
          <span className="font-bold text-sm text-[#70D8E0] truncate tracking-wide">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#849396] font-bold bg-[#1a1d22] px-2.5 py-1 rounded-md border border-[#363d47] shadow-sm">
          <span>{isOpen ? '点击收起' : '点击展开'}</span>
          <span className={cn('transform transition-transform duration-200 text-[10px]', isOpen ? 'rotate-180' : 'rotate-0')}>
            ▼
          </span>
        </div>
      </div>

      {/* 折叠内容区域 */}
      {isOpen && (
        <div className="p-4 bg-[#16191f] text-sm text-[#E6ECE8] space-y-2 border-t border-[#343b44]">
          {content ? (
            <Streamdown components={storyDarkComponents}>{content}</Streamdown>
          ) : (
            <div className="text-[#849396] text-xs italic">暂无内容</div>
          )}
        </div>
      )}
    </div>
  )
}

// 💭 深度思考折叠卡片
const CollapsibleThinkCard: FC<{
  content: string
  isThinking?: boolean
}> = ({ content, isThinking = false }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="my-2.5 rounded-xl border border-[#343b44] bg-[#1a1d22] overflow-hidden shadow-md transition-all">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full flex items-center justify-between px-3.5 py-2 select-none cursor-pointer bg-[#25292f] hover:bg-[#2c333f] border-b border-[#363d47] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💭</span>
          <span className="text-xs font-semibold text-[#B396F2] tracking-wide">
            {isThinking ? '深度思考演算中...' : '深度思考演算过程'}
          </span>
          {isThinking && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70D8E0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70D8E0]"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#849396] font-medium">
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
        <div className="p-3.5 bg-[#13161c] text-xs text-[#849396] font-mono leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto border-t border-[#343b44]">
          {content}
        </div>
      )}
    </div>
  )
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  const { thinkContent, isThinking, remainingText } = useMemo(() => extractThink(content || ''), [content])
  const segments = useMemo(() => parseSegments(remainingText || ''), [remainingText])

  // If there are no think and no details blocks, render directly
  if (!thinkContent && segments.length === 1 && segments[0].type === 'text') {
    return (
      <div className={`streamdown-markdown ${className}`}>
        <Streamdown components={storyDarkComponents}>{segments[0].content}</Streamdown>
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
            <Streamdown components={storyDarkComponents}>{seg.content}</Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export default StreamdownMarkdown

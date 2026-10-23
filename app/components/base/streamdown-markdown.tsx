'use client'
import type { FC } from 'react'
import React, { useMemo, useState } from 'react'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import cn from 'classnames'

interface StreamdownMarkdownProps {
  content: string
  className?: string
  hideChoicesInText?: boolean
}

interface Segment {
  type: 'text' | 'details'
  summary?: string
  content: string
  defaultOpen?: boolean
}

interface NpcField {
  name: string
  val: string
}

interface ParsedNpc {
  trigger: string
  detail: string
  fields: NpcField[]
}

// 提取 NPC 卡片结构数据
function parseNpcContent(rawContent: string): ParsedNpc {
  let trigger = '🔍 观测判定通过（点击查看详情）'
  let detail = ''
  let text = rawContent

  // 1. 匹配并提取 HTML observe-wrap 块
  const wrapMatch = text.match(/<div[^>]*observe-wrap[^>]*>([\s\S]*?)<\/div>/i)
  if (wrapMatch) {
    const inner = wrapMatch[1]
    const trigMatch = inner.match(/<span[^>]*secret-trigger[^>]*>([\s\S]*?)<\/span>/i)
    const popMatch = inner.match(/<span[^>]*secret-popup[^>]*>([\s\S]*?)<\/span>/i)
    if (trigMatch) trigger = trigMatch[1].replace(/<[^>]+>/g, '').trim()
    if (popMatch) detail = popMatch[1].replace(/<[^>]+>/g, '').trim()
    text = text.slice(0, wrapMatch.index) + text.slice(wrapMatch.index! + wrapMatch[0].length)
  }

  // 2. 匹配纯文本观测判定通过容错格式
  if (!detail) {
    const textMatch = text.match(/(?:【隐藏信息】\s*)?(?:🔍\s*)?观测判定通过[（(](?:点击查看详情)?[）)]\s*[：:]\s*([^\n<]+)/i)
    if (textMatch) {
      detail = textMatch[1].trim()
      text = text.slice(0, textMatch.index) + text.slice(textMatch.index! + textMatch[0].length)
    }
  }

  // 3. 提取标准字段（【基础】、【外貌】、【词条】、【能力】、【定位】、【关系】、【状态】等）
  const fieldPattern = /【([^】]+)】([\s\S]*?)(?=【|$)/g
  let fm: RegExpExecArray | null
  const fields: NpcField[] = []
  while ((fm = fieldPattern.exec(text)) !== null) {
    const name = fm[1].trim()
    const val = fm[2].replace(/<[^>]+>/g, '').trim()
    if (name !== '隐藏信息' && val) {
      fields.push({ name, val })
    }
  }

  return { trigger, detail, fields }
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

  // 2. 将紧密粘连的 【字段】 之间强行补足空行，避免 CommonMark 误将其合并为同一个大列表项
  text = text.replace(/([^\n])\n(【[^】]+】)/g, '$1\n\n$2')

  // 3. 将 <span class="t-xxx">内容</span> 转换为 Markdown 链接标记
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

  // 5. 彻底过滤已移至左侧HUD侧边栏的孤立状态栏标题（如 📊 多维系统状态栏）
  text = text
    .replace(/^[#\s]*📊\s*(?:多维系统状态栏|系统状态栏|玩家状态栏|多维状态栏)[^\n]*\n*/gim, '')
    .replace(/^[#\s]*【(?:多维系统状态栏|系统状态栏|玩家状态栏|多维状态栏)】[^\n]*\n*/gim, '')

  // 6. 彻底去除行首所有序号标记（如 1. / 2. / A. / B. / [A] / 1、 / 选项1: 等），替换为极简科技光标 ✦
  text = text.replace(
    /(^|\n)([ \t]*[-*•]?\s*)(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-]\s*/gim,
    '$1$2✦ '
  )

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

  if (!/<details/i.test(raw))
    return [{ type: 'text', content: cleanAndTransformContent(raw) }]

  const segments: Segment[] = []
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
      content: bodyContent, // 保持原始内容供专用卡片组件进一步结构化解析
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
    const cleanText = text
      .replace(/^[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s]*/i, '')
      .replace(/^[\s•\-\*\d\.\、✦]+/, '')
      .trim()
    window.dispatchEvent(new CustomEvent('insert-command', { detail: cleanText }))
  }
}

// 🔍 交互对象深层机密情报卡片组件 (CLASSIFIED_INTEL - 100% 还原原版视觉逻辑与交互)
export const ClassifiedIntel: FC<{ trigger: string; detail: string }> = ({ trigger, detail }) => {
  const [isOpen, setIsOpen] = useState(false)

  const cleanTrigger = trigger.replace(/^🔍\s*/, '') || '观测判定通过（点击查看详情）'

  return (
    <div className="my-2 select-none">
      {/* 观测判定触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none",
          isOpen
            ? "bg-[#b000e8] text-white border-[#b000e8] shadow-[0_0_15px_rgba(176,0,232,0.45)]"
            : "bg-purple-500/15 hover:bg-purple-500/25 active:scale-95 border-purple-500/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
        )}
      >
        <span className="text-sm">🔍</span>
        <span>{cleanTrigger}</span>
        <span className="text-[10px] font-mono transition-transform duration-200">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* 展开的深层机密情报卡片 */}
      {isOpen && (
        <div
          className="mt-2.5 max-w-xl p-[2px] bg-[#b000e8] shadow-[0_0_20px_rgba(176,0,232,0.35)] animate-fade-in transition-all"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
            borderRadius: '10px 10px 0 10px',
          }}
        >
          <div
            className="h-full w-full overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%)',
              borderRadius: '8px 8px 0 8px',
            }}
          >
            {/* 霓虹紫标头 */}
            <div className="bg-[#b000e8] text-white font-mono font-black text-xs py-1.5 tracking-widest text-center shadow-sm select-none flex items-center justify-center gap-2">
              <span className="text-[10px] text-fuchsia-200">✦</span>
              <span>CLASSIFIED_INTEL</span>
              <span className="text-[10px] text-fuchsia-200">✦</span>
            </div>

            {/* 机密内容主体 */}
            <div className="p-4 bg-[#1b1424] text-xs sm:text-sm text-purple-100 font-medium leading-relaxed whitespace-pre-wrap">
              {detail}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 👥 专属交互 NPC 档案卡片组件（1:1 还原原版风月设计，词条与隐藏信息绝对隔离独立）
const InteractiveNpcCard: FC<{
  summary: string
  content: string
  defaultOpen?: boolean
}> = ({ summary, content, defaultOpen = true }) => {
  const cleanSummary = summary
    .replace(/^[▶▼\s]+/, '')
    .replace(/交互对象\s*\d+\s*[|｜]/, '交互对象 |')
    .trim()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { trigger, detail, fields } = useMemo(() => parseNpcContent(content), [content])

  return (
    <div className="my-3 rounded-xl border border-purple-500/40 bg-[#161220] hover:border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.12)] overflow-hidden transition-all duration-200">
      {/* 折叠栏头部 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-[#251b36] hover:bg-[#2d2141] border-b border-purple-500/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-purple-300 shrink-0">
            {isOpen ? '▼' : '▶'}
          </span>
          <span className="font-bold text-sm text-[#f3e8ff] truncate tracking-wide">
            {cleanSummary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#849396] font-medium bg-[#13151b] px-2 py-0.5 rounded-md border border-[#343b44]/60">
          <span>{isOpen ? '收起' : '展开'}</span>
        </div>
      </div>

      {/* 折叠内容区域 */}
      {isOpen && (
        <div className="p-4 bg-[#14101d] text-sm text-[#E6ECE8] space-y-2.5">
          {fields.length > 0 ? (
            fields.map((f, i) => {
              if (f.name === '词条') {
                const traitLines = f.val.split('\n').map(l => l.trim()).filter(Boolean)
                return (
                  <div key={i} className="space-y-1.5 my-1">
                    <div className="font-bold text-white tracking-wide text-xs sm:text-sm">【词条】</div>
                    {traitLines.map((line, idx) => {
                      const match = line.match(/^[-*•\s]*[▶▼\s]*\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([\s\S]*)/)
                      if (match) {
                        const colorChar = match[1]
                        const textPart = match[2].trim()
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.15)] flex items-start gap-2 text-xs sm:text-sm"
                          >
                            <span className="text-cyan-400 mt-0.5 text-xs">▶</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shrink-0">
                              {colorChar}
                            </span>
                            <span className="font-medium text-cyan-100 flex-1 leading-relaxed">
                              {textPart}
                            </span>
                          </div>
                        )
                      }
                      return (
                        <div key={idx} className="text-xs text-cyan-200 pl-2">
                          {line}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // 常规属性字段
              return (
                <div key={i} className="leading-relaxed text-xs sm:text-sm">
                  <span className="font-bold text-[#E6ECE8] tracking-wide">【{f.name}】</span>
                  <span className="text-[#c7d2dc] ml-1">{f.val}</span>
                </div>
              )
            })
          ) : (
            <Streamdown
              components={storyDarkComponents}
            >
              {cleanAndTransformContent(content)}
            </Streamdown>
          )}

          {/* 隐藏机密情报卡片（可点击交互展开） */}
          {detail && (
            <div className="pt-2 border-t border-[#2d223f] space-y-1.5">
              <div className="font-bold text-white tracking-wide text-xs sm:text-sm">【隐藏信息】</div>
              <ClassifiedIntel trigger={trigger} detail={detail} />
            </div>
          )}
        </div>
      )}
    </div>
  )
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

    // 3. 词条胶囊单行识别（严格限制单行匹配，绝不跨行合并后续段落）
    const traitMatch = text.match(/^[▶▼\s]*\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([^\n]+)/)
    if (traitMatch) {
      const colorChar = traitMatch[1]
      const rest = traitMatch[2]

      const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; shadow: string }> = {
        '蓝': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-200', badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50', shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
        '金': { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-200', badge: 'bg-amber-500/25 text-amber-300 border-amber-400/50', shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]' },
        '紫': { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-200', badge: 'bg-purple-500/25 text-purple-300 border-purple-400/50', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.15)]' },
        '绿': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-200', badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]' },
        '红': { bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-200', badge: 'bg-rose-500/25 text-rose-300 border-rose-400/50', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.15)]' },
      }
      const style = colorMap[colorChar] || colorMap['蓝']

      return (
        <div className={`my-2 p-2.5 rounded-xl border ${style.bg} ${style.border} ${style.shadow} flex items-start gap-2 text-xs sm:text-sm transition-all`}>
          <span className="text-xs text-[#70D8E0] mt-0.5">▶</span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${style.badge} shrink-0`}>
            [ {colorChar} ]
          </span>
          <span className={`${style.text} leading-relaxed font-medium`}>
            {rest.replace(/^[\s：:]+/, '')}
          </span>
        </div>
      )
    }

    // 默认叙事正文
    return <p className="my-2 leading-relaxed text-[#c7d2dc] text-sm sm:text-base font-normal" {...props}>{children}</p>
  },
  ol: ({ children, ...props }: any) => (
    <ol className="my-2 space-y-1.5 list-none pl-0" {...props}>
      {children}
    </ol>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-2 space-y-1.5 list-none pl-0" {...props}>
      {children}
    </ul>
  ),
  strong: ({ children, ...props }: any) => {
    const text = extractRawText(children).trim()
    if (/^[A-E1-4]\b|^选项\s*[A-E1-4]/i.test(text)) {
      const cleanText = text.replace(/^[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s]*/i, '')
      return (
        <strong
          className="text-[#E3C362] font-black cursor-pointer hover:underline hover:text-[#f3d982] transition-colors"
          onClick={() => handleOptionClick(cleanText)}
          title="点击将此决策指令填入输入框"
          {...props}
        >
          {cleanText}
        </strong>
      )
    }
    return (
      <strong className="text-[#E3C362] font-bold" {...props}>
        {children}
      </strong>
    )
  },
  li: ({ children, ...props }: any) => {
    const rawText = extractRawText(children).trim()

    // 词条单行胶囊识别
    const traitMatch = rawText.match(/^[▶▼\s]*\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([^\n]+)/)
    if (traitMatch) {
      const colorChar = traitMatch[1]
      const rest = traitMatch[2]

      const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; shadow: string }> = {
        '蓝': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-200', badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50', shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
        '金': { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-200', badge: 'bg-amber-500/25 text-amber-300 border-amber-400/50', shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]' },
        '紫': { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-200', badge: 'bg-purple-500/25 text-purple-300 border-purple-400/50', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.15)]' },
        '绿': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-200', badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]' },
        '红': { bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-200', badge: 'bg-rose-500/25 text-rose-300 border-rose-400/50', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.15)]' },
      }
      const style = colorMap[colorChar] || colorMap['蓝']

      return (
        <li className={`my-2 p-2.5 rounded-xl border ${style.bg} ${style.border} ${style.shadow} flex items-start gap-2 text-xs sm:text-sm list-none transition-all`}>
          <span className="text-xs text-[#70D8E0] mt-0.5">▶</span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${style.badge} shrink-0`}>
            [ {colorChar} ]
          </span>
          <span className={`${style.text} leading-relaxed font-medium`}>
            {rest.replace(/^[\s：:]+/, '')}
          </span>
        </li>
      )
    }

    // 决策选项行动项（无序号，带有 ✦ 前缀或纯行动指令卡片）
    const isActionChoice = rawText.startsWith('✦') || /^[A-E1-4]\b|^选项\s*[A-E1-4]/i.test(rawText)
    const cleanActionText = rawText
      .replace(/^[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s]*/i, '')
      .replace(/^✦\s*/, '')
      .trim()

    if (isActionChoice) {
      return (
        <li
          className="my-2 p-2.5 rounded-xl bg-[#1b1f26] border border-[#2d3542] hover:border-[#70D8E0] hover:bg-[#222832] transition-all cursor-pointer flex items-start gap-2.5 list-none group text-sm"
          onClick={() => handleOptionClick(cleanActionText)}
          title="点击将此决策指令填入输入框"
          {...props}
        >
          <span className="text-[#70D8E0] text-xs mt-0.5 group-hover:scale-125 transition-transform shrink-0">✦</span>
          <div className="flex-1 leading-relaxed text-[#c7d2dc] group-hover:text-white transition-colors">
            {cleanActionText}
          </div>
        </li>
      )
    }

    return (
      <li className="my-1.5 flex items-start gap-2 text-[#c7d2dc] text-sm leading-relaxed list-none" {...props}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#70D8E0] mt-2 shrink-0" />
        <span className="flex-1">{cleanActionText || children}</span>
      </li>
    )
  },
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-2 border-[#70D8E0] pl-4 my-3 text-sm italic text-[#849396] bg-[#14171d] py-2 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => (
    <hr className="border-t border-[#262c36] my-4" {...props} />
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#343b44] shadow-md">
      <table className="w-full text-left border-collapse text-xs sm:text-sm bg-[#16191f]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[#1f242d] text-[#70D8E0] font-semibold border-b border-[#343b44]" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-[#262c36] text-[#c7d2dc]" {...props}>
      {children}
    </tbody>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-3.5 py-2.5 font-bold tracking-wider" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3.5 py-2 leading-relaxed" {...props}>{children}</td>
  ),
  code: ({ children, className, ...props }: any) => {
    const rawText = extractRawText(children)
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
    return (
      <code className="bg-[#25292f] text-[#E3C362] px-1.5 py-0.5 rounded text-xs font-mono border border-[#363d47]" {...props}>{children}</code>
    )
  },
  pre: ({ children, ...props }: any) => (
    <pre className="bg-[#13161c] text-[#70D8E0] p-3.5 rounded-xl border border-[#343b44] text-xs font-mono overflow-x-auto my-2.5" {...props}>{children}</pre>
  ),
  a: ({ href, children, ...props }: any) => {
    if (href && (href.startsWith('#t-') || href.startsWith('#t_'))) {
      const clsName = href.slice(1)
      return (
        <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-xs bg-[#25292f] border border-[#363d47] shadow-sm ${clsName}`}>
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

// Custom Collapsible Details Card (系统推演 / 状态栏折叠卡 / 交互对象)
const CollapsibleDetailsCard: FC<{
  summary: string
  content: string
  defaultOpen?: boolean
}> = ({ summary, content, defaultOpen = false }) => {
  const cleanSummary = summary
    .replace(/^[▶▼\s]+/, '')
    .replace(/交互对象\s*\d+\s*[|｜]/, '交互对象 |')
    .trim()

  // 识别是否属于重点交互对象 / NPC 档案卡片
  const isInteractiveTarget =
    cleanSummary.includes('交互') ||
    cleanSummary.includes('NPC') ||
    cleanSummary.includes('对象') ||
    cleanSummary.includes('同伴') ||
    cleanSummary.includes('伙伴') ||
    cleanSummary.includes('人物') ||
    cleanSummary.includes('角色') ||
    cleanSummary.includes('变异体') ||
    cleanSummary.includes('辅助者') ||
    cleanSummary.includes('引导者') ||
    cleanSummary.includes('队长') ||
    cleanSummary.includes('詹岚') ||
    cleanSummary.includes('张杰') ||
    cleanSummary.includes('郑吒') ||
    cleanSummary.includes('马修') ||
    (content && (content.includes('【基础】') || content.includes('【关系】') || content.includes('【定位】') || content.includes('【词条】')))

  // 若为交互 NPC 卡片，转入专属结构化高保真渲染器（默认展开，保证正文中在场各NPC均完整直观显示）
  if (isInteractiveTarget) {
    return (
      <InteractiveNpcCard
        summary={summary}
        content={content}
        defaultOpen={true}
      />
    )
  }

  // 识别是否属于已移至左侧HUD侧边栏的固定面板 (玩家档案 / 系统面板 / 属性面板 / 状态栏)
  const isFixedHudPanel =
    cleanSummary.includes('玩家档案') ||
    cleanSummary.includes('系统面板') ||
    cleanSummary.includes('角色档案') ||
    cleanSummary.includes('属性面板') ||
    cleanSummary.includes('状态栏') ||
    cleanSummary.includes('数据看板')

  if (isFixedHudPanel) {
    return null
  }

  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-3 rounded-xl border border-[#343b44] bg-[#1a1d22] hover:border-[#70D8E0]/40 overflow-hidden shadow-lg transition-all duration-200">
      {/* 折叠栏头部 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {

          if (e.key === 'Enter' || e.key === ' ')
            setIsOpen(!isOpen)
        }}
        className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-[#25292f] hover:bg-[#2c333f] border-b border-[#363d47] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs transition-colors shrink-0 font-mono text-[#70D8E0]">
            {isOpen ? '▼' : '▶'}
          </span>
          <span className="font-bold text-sm truncate tracking-wide text-[#E6ECE8]">
            {cleanSummary}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#849396] font-medium bg-[#13151b] px-2 py-0.5 rounded-md border border-[#343b44]/60">
          <span>{isOpen ? '收起' : '展开'}</span>
        </div>
      </div>

      {/* 折叠内容区域 */}
      {isOpen && (
        <div className="p-4 text-sm text-[#E6ECE8] space-y-2 border-t bg-[#16191f] border-[#343b44]">
          {content ? (
            <Streamdown
              components={storyDarkComponents}
            >
              {cleanAndTransformContent(content)}
            </Streamdown>
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

export function StreamdownMarkdown({ content, className = '', hideChoicesInText = false }: StreamdownMarkdownProps) {
  const processedRaw = useMemo(() => {
    if (!content) return content
    let text = content

    if (hideChoicesInText) {
      // 彻底切除回复末尾的行动选项与决策引导区域（已在底部常驻决策按钮条中显示）
      const choiceHeadingIdx = text.search(
        /(?:\n\s*|^)(?:[#*`\s]*)(?:(?:🎲|🎯|⚡|【)\s*)?(?:行动指令与决策引导|决策引导|行动指令|行动抉择|行动指南|可选行动|你要如何回应[？?]?|行动建议|行动选项|下一步行动|决策分支)(?:[*`\s]*[:：]?)/i
      )
      if (choiceHeadingIdx !== -1) {
        text = text.slice(0, choiceHeadingIdx).trim()
      } else {
        // 兜底：处理没有标题、直接在末尾输出多个选项的情况
        const trailingChoicesMatch = text.match(
          /(?:\n\s*|^)(?:[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s][^\n]+\n?){2,}\s*$/i
        )
        if (trailingChoicesMatch && trailingChoicesMatch.index !== undefined) {
          text = text.slice(0, trailingChoicesMatch.index).trim()
        }
      }
    }

    return text
  }, [content, hideChoicesInText])

  const { thinkContent, isThinking, remainingText } = useMemo(() => extractThink(processedRaw || ''), [processedRaw])
  const segments = useMemo(() => parseSegments(remainingText || ''), [remainingText])

  // If there are no think and no details blocks, render directly
  if (!thinkContent && segments.length === 1 && segments[0].type === 'text') {
    return (
      <div className={`streamdown-markdown ${className}`}>
        <Streamdown
          components={storyDarkComponents}
        >
          {segments[0].content}
        </Streamdown>
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
            <Streamdown
              components={storyDarkComponents}
            >
              {seg.content}
            </Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export default StreamdownMarkdown

'use client'
import React, { useState } from 'react'
import cn from 'classnames'

export interface QuickCommand {
  id: string
  name: string
  template: string
  description?: string
  category?: string
}

const DEFAULT_COMMANDS: QuickCommand[] = [
  {
    id: 'add_status',
    name: '增加状态栏',
    template: '【指令：增加状态栏：[此处填写状态栏名称]，以下是状态栏的具体要求：[在此处填写要求]】',
    description: '命令系统新增状态栏数值监控',
    category: '系统指令',
  },
  {
    id: 'add_npc',
    name: '增加羁绊npc',
    template: '【指令：增加羁绊npc：[此处填写NPC名称]，以下是NPC的具体要求：[在此处填写要求]】',
    description: '注册关键NPC并开启好感/羁绊追踪',
    category: '角色互动',
  },
  {
    id: 'save',
    name: '增加存档',
    template: '【指令：增加存档：[此处填写存档节点名称或说明]】',
    description: '固化当前回合状态为关键记忆存档点',
    category: '系统指令',
  },
  {
    id: 'load_story',
    name: '载入剧情',
    template: '【指令：载入剧情：[此处填写想要载入的剧情线或目标]】',
    description: '引导AI主控推进指定剧情或副本事件',
    category: '剧情推进',
  },
  {
    id: 'settle_world',
    name: '离开世界（结算）',
    template: '【指令：离开世界（结算）】',
    description: '通关或死遁，计算无限流轮回评价与奖励',
    category: '世界轮回',
  },
  {
    id: 'write_more',
    name: '多写点',
    template: '请继续详细描写，多写一点环境细节、心理活动与人物互动。',
    description: '让AI展开更具沉浸感的细腻描写',
    category: '描写增强',
  },
  {
    id: 'rebirth',
    name: '无限重生',
    template: '【指令：触发系统特权：发动超低消耗无限重生天赋，推演当前死局破局点！】',
    description: '发动宿主核心天赋，死亡回溯推演破局生路',
    category: '宿主天赋',
  },
  {
    id: 'check_panel',
    name: '查看状态',
    template: '【指令：刷新并输出当前人物完整属性面板、羁绊关系与背包】',
    description: '查看当前人物面板、生命状态与世界重要度',
    category: '系统指令',
  },
]

interface QuickCommandsBarProps {
  onInsertCommand: (template: string) => void
  className?: string
}

export const QuickCommandsBar: React.FC<QuickCommandsBarProps> = ({
  onInsertCommand,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showMoreModal, setShowMoreModal] = useState(false)
  const [customCommands, setCustomCommands] = useState<QuickCommand[]>([])
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdTemplate, setNewCmdTemplate] = useState('')

  const allCommands = [...DEFAULT_COMMANDS, ...customCommands]

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCmdName.trim() || !newCmdTemplate.trim()) return
    const newCmd: QuickCommand = {
      id: `custom_${Date.now()}`,
      name: newCmdName.trim(),
      template: newCmdTemplate.trim(),
      category: '自定义指令',
    }
    setCustomCommands([...customCommands, newCmd])
    setNewCmdName('')
    setNewCmdTemplate('')
  }

  if (isCollapsed) {
    return (
      <div className={cn('flex items-center mb-1.5', className)}>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50/90 hover:bg-purple-100 border border-purple-200 rounded-full shadow-xs transition-all backdrop-blur-xs"
        >
          <span>⚡ 显示快捷指令</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5 select-none',
          className
        )}
      >
        {/* 更多按钮 */}
        <button
          type="button"
          onClick={() => setShowMoreModal(true)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white/95 hover:bg-purple-50 hover:text-purple-700 border border-gray-200/90 hover:border-purple-300 rounded-full shadow-xs transition-all backdrop-blur-xs"
        >
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>更多</span>
        </button>

        {/* 隐藏按钮 */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-purple-600 bg-white/90 hover:bg-purple-50 border border-gray-200/80 hover:border-purple-300 rounded-full shadow-xs transition-all backdrop-blur-xs"
          title="收起快捷指令栏"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>隐藏</span>
        </button>

        {/* 常用预设快捷按钮 */}
        {allCommands.map((cmd) => (
          <button
            key={cmd.id}
            type="button"
            onClick={() => onInsertCommand(cmd.template)}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white/95 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 border border-gray-200 hover:border-purple-400 rounded-full shadow-xs hover:shadow-sm active:scale-95 transition-all whitespace-nowrap"
            title={cmd.description || cmd.template}
          >
            {cmd.name}
          </button>
        ))}
      </div>

      {/* 更多指令与自定义模态窗 */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-5 bg-white rounded-2xl shadow-2xl border border-purple-100 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <h3 className="font-bold text-gray-900 text-base">游戏指令管理库</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* 指令分类列表 */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-2">快捷指令库</h4>
                <div className="grid grid-cols-2 gap-2">
                  {allCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => {
                        onInsertCommand(cmd.template)
                        setShowMoreModal(false)
                      }}
                      className="p-3 text-left rounded-xl bg-gray-50/80 hover:bg-purple-50/80 border border-gray-100 hover:border-purple-200 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-gray-800 group-hover:text-purple-700">{cmd.name}</span>
                        {cmd.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200/70 text-gray-600">
                            {cmd.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{cmd.description || cmd.template}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 添加自定义快捷指令 */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100/80">
                <h4 className="text-xs font-bold text-purple-900 mb-2">➕ 添加自定义快捷指令</h4>
                <form onSubmit={handleAddCustom} className="space-y-2">
                  <div>
                    <input
                      type="text"
                      value={newCmdName}
                      onChange={(e) => setNewCmdName(e.target.value)}
                      placeholder="按钮名称（例如：查看背包）"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={newCmdTemplate}
                      onChange={(e) => setNewCmdTemplate(e.target.value)}
                      placeholder="指令模板（例如：【指令：查看当前背包与道具】）"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCmdName.trim() || !newCmdTemplate.trim()}
                      className="px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                    >
                      添加至栏位
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QuickCommandsBar

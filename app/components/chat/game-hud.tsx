'use client'
import React, { useState } from 'react'
import cn from 'classnames'
import WorldAccessModal from './world-access-modal'

import type { ChatItem } from '@/types/app'

interface GameHudProps {
  onStartGame?: (formattedMessage: string) => void
  hasStarted?: boolean
  className?: string
  chatList?: ChatItem[]
}

export const GameHud: React.FC<GameHudProps> = ({
  onStartGame,
  hasStarted = true,
  className,
  chatList = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)

  // 角色档案与位面状态
  const [profile, setProfile] = useState({
    name: '李逍遥',
    gender: '男',
    age: '20',
    appearance: '一袭黑衣，眼神冷冽如刀',
    personality: '极致理智、善于洞察微末因果',
    xp: '超低消耗无限重生系统',
    others: '善于暗中布局与死局翻盘',
  })

  const [mode, setMode] = useState('全新攻略者')
  const [world, setWorld] = useState('344.无限恐怖 (生化危机一·激光通道)')
  const [importanceRank, setImportanceRank] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('E')

  // 监听并从对话历史的第一条降临指令中实时解析世界设定
  React.useEffect(() => {
    const firstUserMsg = chatList?.find(item => !item.isAnswer && !item.isOpeningStatement)?.content
    if (firstUserMsg) {
      const worldMatch = firstUserMsg.match(/1\.\s*锚定位面：([^\n]+)/)
      if (worldMatch && worldMatch[1]) {
        setWorld(worldMatch[1].trim())
      }
      const nameMatch = firstUserMsg.match(/姓名:\s*([^\s｜|]+)/)
      if (nameMatch && nameMatch[1]) {
        setProfile((prev) => ({ ...prev, name: nameMatch[1].trim() }))
      }
      const rankMatch = firstUserMsg.match(/\[评级:\s*([A-Za-z]+)\]/)
      if (rankMatch && rankMatch[1]) {
        setImportanceRank(rankMatch[1].trim().toUpperCase() as any)
      }
      const personalityMatch = firstUserMsg.match(/性格倾向:\s*([^\n]+)/)
      if (personalityMatch && personalityMatch[1]) {
        setProfile((prev) => ({ ...prev, personality: personalityMatch[1].trim() }))
      }
      const appearanceMatch = firstUserMsg.match(/外貌特征:\s*([^\n]+)/)
      if (appearanceMatch && appearanceMatch[1]) {
        setProfile((prev) => ({ ...prev, appearance: appearanceMatch[1].trim() }))
      }
      const othersMatch = firstUserMsg.match(/潜在特质:\s*([^\n]+)/)
      if (othersMatch && othersMatch[1]) {
        setProfile((prev) => ({ ...prev, others: othersMatch[1].trim() }))
      }
    }
  }, [chatList])

  const handleLaunch = (formattedMessage: string) => {
    // 自动提取位面与宿主名，用于同步 HUD 显示
    const worldMatch = formattedMessage.match(/1\.\s*锚定位面：([^\n]+)/)
    if (worldMatch && worldMatch[1]) {
      setWorld(worldMatch[1].trim())
    }
    const nameMatch = formattedMessage.match(/姓名:\s*([^\s｜|]+)/)
    if (nameMatch && nameMatch[1]) {
      setProfile((prev) => ({ ...prev, name: nameMatch[1].trim() }))
    }
    const rankMatch = formattedMessage.match(/\[评级:\s*([A-Za-z]+)\]/)
    if (rankMatch && rankMatch[1]) {
      setImportanceRank(rankMatch[1].trim().toUpperCase() as any)
    }

    onStartGame?.(formattedMessage)
    setShowSetupModal(false)
  }

  return (
    <div className={cn('w-full mb-4', className)}>
      {/* 顶部科技感 HUD 胶囊条 */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#0d1322]/95 via-[#131c36]/95 to-[#0b1220]/95 border-2 border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.25)] p-3.5 text-white backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 左侧：主机状态 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-[2px] shadow-md overflow-hidden">
                <img src="/bot-avatar.jpg" alt="HUD" className="w-full h-full object-cover rounded-[10px]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">无限重生系统</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {world.split(' ')[0]}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  宿主: {profile.name}
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate max-w-xs md:max-w-md mt-0.5">
                当前位面：<span className="text-gray-200">{world}</span>
              </div>
            </div>
          </div>

          {/* 右侧：世界重要度评级与操作 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-xl border border-white/10 text-xs">
              <span className="text-gray-400">世界重要度:</span>
              <span className="font-black text-sm text-yellow-400 tracking-wider">
                {importanceRank} 级
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-400/40 shadow-xs transition-all active:scale-95"
            >
              ⚙️ 身份/世界设定
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title={isExpanded ? '收起属性详情' : '展开属性详情'}
            >
              <svg
                className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 展开的宿主详细属性折叠卡 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-gray-400 text-[10px]">核心天赋</div>
              <div className="font-semibold text-cyan-300 truncate">超低消耗无限重生</div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-gray-400 text-[10px]">性格特质</div>
              <div className="font-semibold text-purple-300 truncate">{profile.personality}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-gray-400 text-[10px]">外貌特征</div>
              <div className="font-semibold text-gray-200 truncate">{profile.appearance}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-gray-400 text-[10px]">隐藏加成</div>
              <div className="font-semibold text-yellow-300 truncate">{profile.others}</div>
            </div>
          </div>
        )}
      </div>

      {/* 诸天位面接入与天赋抽卡模态框 */}
      <WorldAccessModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onLaunch={handleLaunch}
      />
    </div>
  )
}

export default GameHud

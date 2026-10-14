'use client'
import React, { useState } from 'react'
import cn from 'classnames'

interface GameHudProps {
  onStartGame?: (formattedMessage: string) => void
  hasStarted?: boolean
  className?: string
}

export const GameHud: React.FC<GameHudProps> = ({
  onStartGame,
  hasStarted = true,
  className,
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
    xp: '无',
    others: '善于暗中布局与死局翻盘',
  })

  const [mode, setMode] = useState('全新攻略者')
  const [world, setWorld] = useState('344.无限恐怖 (生化危机一·激光通道)')
  const [importanceRank, setImportanceRank] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('E')

  const recommendedWorlds = [
    '344.无限恐怖 (生化危机一·激光通道)',
    '316.宿命之环 (诡秘之主二部·特里尔)',
    '437.梦幻西游 (人仙魔三界乱世)',
    '215.变形金刚 (塞伯坦星火种源)',
    '01.火影忍者 (木叶村忍者学校)',
    '03.死神 (尸魂界护廷十三队)',
  ]

  const handleLaunch = () => {
    const formattedMessage = `【宿主初始灵魂档案已锚定】
姓名: ${profile.name} ｜ 性别: ${profile.gender} ｜ 年龄: ${profile.age}
外貌: ${profile.appearance} ｜ 性格: ${profile.personality}
XP系统: ${profile.xp} ｜ 特质: ${profile.others}
开局模式: ${mode} ｜ 锚定位面: ${world}

灵魂绑定完毕，请系统为主机开启第一幕降临剧情！`

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

      {/* 录入身份 / 位面锚定弹窗 */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 bg-[#0a101f] text-gray-200 rounded-2xl shadow-2xl border-2 border-cyan-500/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30 mb-4">
              <h3 className="font-black text-base text-cyan-400 tracking-wider">
                🌌 诸天位面锚定与灵魂档案配置
              </h3>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-cyan-300 mb-1">宿主姓名</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-cyan-300 mb-1">性别</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="未知/秀吉">未知 / 秀吉</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-cyan-300 mb-1">年龄</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cyan-300 mb-1">外貌描写</label>
                <input
                  type="text"
                  value={profile.appearance}
                  onChange={(e) => setProfile({ ...profile, appearance: e.target.value })}
                  className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-bold text-cyan-300 mb-1">性格与特质</label>
                <input
                  type="text"
                  value={profile.personality}
                  onChange={(e) => setProfile({ ...profile, personality: e.target.value })}
                  className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-bold text-cyan-300 mb-1">位面锚定（选择或输入你要前往的世界）</label>
                <input
                  type="text"
                  value={world}
                  onChange={(e) => setWorld(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050b17] border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400 mb-2"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {recommendedWorlds.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWorld(w)}
                      className={cn(
                        'p-2 text-left rounded-lg border transition-all text-[11px] truncate',
                        world === w
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                          : 'bg-[#060e1d] border-gray-800 text-gray-400 hover:border-gray-600'
                      )}
                    >
                      🎲 {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-bold text-white text-sm tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                >
                  🚀 确认锚定，以该身份启动剧情！
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameHud

'use client'

import React from 'react'
import type { GameHudState, CompanionInfo } from '@/hooks/use-game-hud-state'

interface GameHudSidebarProps {
  state: GameHudState
  onOpenShop: () => void
  onOpenBackpack: () => void
  onOpenCompanion: (companion?: CompanionInfo) => void
  onOpenLog?: () => void
  isMobileDrawer?: boolean
  onCloseDrawer?: () => void
}

export const GameHudSidebar: React.FC<GameHudSidebarProps> = ({
  state,
  onOpenShop,
  onOpenBackpack,
  onOpenCompanion,
  onOpenLog,
  isMobileDrawer = false,
  onCloseDrawer,
}) => {
  const {
    playerName,
    realm,
    rank,
    world,
    worldOffset,
    currency,
    currencyName,
    statusBars,
    equipment,
    skills,
    inventory,
    quests,
    companions: rawCompanions,
    activeCompanion,
  } = state

  const companions = (rawCompanions && rawCompanions.length > 0) ? rawCompanions : (activeCompanion ? [activeCompanion] : [])

  const containerClasses = isMobileDrawer
    ? 'flex flex-col h-full w-[300px] sm:w-[340px] frosted-theme-card p-4 text-xs select-none shadow-2xl bg-[#161a22]/95 border-r border-white/10'
    : 'hidden lg:flex max-lg:hidden lg:w-[22%] lg:min-w-[280px] lg:max-w-[340px] flex-col overflow-hidden frosted-theme-card rounded-2xl p-4 flex-shrink-0 h-full select-none text-xs border border-white/10 bg-[#161a22]/85 backdrop-blur-md shadow-2xl'

  return (
    <div className={containerClasses} id={isMobileDrawer ? 'mobile-hud-drawer' : 'desktop-hud-sidebar'}>
      {/* Header */}
      <div className="flex flex-col gap-2.5 border-b border-white/10 pb-3 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{playerName}</span>
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
              [{rank}级]
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-300 font-medium">
              {realm}
            </span>
            {isMobileDrawer && (
              <button
                onClick={onCloseDrawer}
                className="text-slate-400 hover:text-white p-1 text-sm rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Currency & Quick Hub Buttons */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="font-bold text-sm text-yellow-400 flex items-center">
            <span className="mr-1">🪙</span>
            <span>{currency.toLocaleString()}</span>
            <span className="text-xs opacity-85 ml-1 font-normal text-yellow-200/80">{currencyName}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenShop}
              className="text-yellow-300 hover:text-yellow-100 transition-colors flex items-center gap-1 text-[11px] font-bold bg-yellow-600/10 hover:bg-yellow-600/30 px-2 py-1 rounded border border-yellow-600/30 cursor-pointer shadow-sm active:scale-95"
              id="embedded-open-shop-btn"
              title="进入主神兑换商店"
              type="button"
            >
              <span>🏪</span>
              <span>商店</span>
            </button>
            <button
              onClick={onOpenLog}
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold bg-slate-700/30 hover:bg-slate-600/50 px-2 py-1 rounded border border-slate-600/50 cursor-pointer shadow-sm active:scale-95"
              id="embedded-log-btn"
              title="查看因果流转记录"
              type="button"
            >
              <span>📜</span>
              <span>记录</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded HUD Content Panels (Scrollable) */}
      <div className="overflow-y-auto pr-1 space-y-4 flex-grow text-xs custom-scrollbar" id="embedded-player-hud">
        {/* Status Bars Container */}
        <div className="space-y-2.5" id="embedded-player-status-bars-container">
          {statusBars.map((bar, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>{bar.name}</span>
                <span className="font-mono text-slate-200">{bar.value} / {bar.maxValue}</span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-3 overflow-hidden bg-black/40 border border-white/5 relative">
                <div
                  className={`${bar.color} h-full rounded-full transition-all duration-500 shadow-sm`}
                  style={{ width: `${bar.percentage}%` }}
                />
              </div>
            </div>
          ))}

          {/* World & Offset Indicator */}
          <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">因果偏移</span>
            <span className="font-mono font-bold text-cyan-300">{worldOffset}</span>
          </div>
        </div>

        {/* Companions / Interactive NPCs List (支持多个随行同伴/交互NPC) */}
        {companions && companions.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-purple-300 flex items-center justify-between mb-1 border-b border-purple-500/20 pb-1">
              <span className="flex items-center gap-1.5">
                <span>👥</span>
                <span>同行NPC ({companions.length})</span>
              </span>
              <span className="text-[10px] text-purple-400 font-normal">点击互动</span>
            </h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
              {companions.map((comp, idx) => (
                <div
                  key={comp.name || idx}
                  onClick={() => onOpenCompanion(comp)}
                  className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 cursor-pointer transition-all shadow-sm group"
                  title={`点击查看【${comp.name}】机密档案与互动`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-200 min-w-0">
                      <span className="text-sm shrink-0">{comp.avatar || '👥'}</span>
                      <span className="truncate">{comp.name}</span>
                      {comp.title && (
                        <span className="text-[10px] text-purple-300/70 font-normal truncate max-w-[80px]">
                          ({comp.title})
                        </span>
                      )}
                    </div>
                    <span className="text-rose-400 font-mono text-[11px] font-bold shrink-0 ml-1">
                      ❤️ {comp.affinity}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, comp.affinity))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Panel */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1.5">
              <span>⚔️</span>
              <span>装备</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">已装配</span>
          </h4>
          <ul className="space-y-1.5 text-xs" id="embedded-player-equipment-list">
            {equipment.map((eq, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors"
              >
                <span className="text-slate-400 text-[10px]">[{eq.slot}]</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{eq.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Skills & Awakened Traits Panel */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1.5">
              <span>✦</span>
              <span>天赋词条</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">{skills.length} 项</span>
          </h4>
          <ul className="space-y-1 text-xs" id="embedded-player-skills-list">
            {skills.map((skill, idx) => (
              <li
                key={idx}
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/20 border border-white/5"
              >
                <span className={`px-1 py-0.2 rounded text-[10px] font-bold border ${skill.color}`}>
                  [{skill.grade}]
                </span>
                <span className="font-medium text-slate-200 truncate">{skill.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Inventory / Backpack Panel */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1.5">
              <span>🎒</span>
              <span>随身背包</span>
            </span>
            <button
              onClick={onOpenBackpack}
              className="text-[10px] text-[#70D8E0] hover:underline cursor-pointer font-normal"
            >
              整理行囊 ↗
            </button>
          </h4>
          <ul className="space-y-1 text-xs" id="embedded-player-inventory-list">
            {inventory.slice(0, 5).map((item, idx) => (
              <li
                key={idx}
                onClick={onOpenBackpack}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                <span className="text-slate-200 truncate max-w-[140px]">{item.name}</span>
                <span className="text-[10px] font-mono text-amber-300 font-bold px-1.5 py-0.2 bg-white/5 rounded">
                  x{item.count}
                </span>
              </li>
            ))}
            {inventory.length > 5 && (
              <li
                onClick={onOpenBackpack}
                className="text-center py-1 text-[11px] text-[#70D8E0] hover:underline cursor-pointer"
              >
                查看全部 {inventory.length} 样物资...
              </li>
            )}
          </ul>
        </div>

        {/* Quests Panel */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5 border-b border-white/5 pb-1">
            <span>📜</span>
            <span>任务日志</span>
          </h4>
          <ul className="space-y-1.5 text-xs" id="embedded-player-quest-list">
            {quests.map((q, idx) => (
              <li
                key={idx}
                className={`p-2 rounded-lg text-[11px] leading-relaxed ${
                  q.isMain
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                    : 'bg-cyan-950/20 border border-cyan-500/30 text-cyan-200'
                }`}
              >
                <div className="font-bold mb-0.5 flex items-center gap-1">
                  <span>{q.isMain ? '【主线】' : '【支线】'}</span>
                </div>
                <div>{q.title}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

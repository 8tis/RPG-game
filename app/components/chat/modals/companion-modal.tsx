'use client'

import React, { useState } from 'react'
import type { CompanionInfo } from '@/hooks/use-game-hud-state'
import { ClassifiedIntel } from '@/app/components/base/streamdown-markdown'

interface CompanionModalProps {
  isOpen: boolean
  onClose: () => void
  companion: CompanionInfo | null
  companions?: CompanionInfo[]
  onSelectCompanion?: (companion: CompanionInfo) => void
  onAction?: (actionText: string) => void
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  isOpen,
  onClose,
  companion,
  companions,
  onSelectCompanion,
  onAction,
}) => {
  if (!isOpen || !companion) return null

  const handleInteract = (type: string) => {
    switch (type) {
      case 'talk':
        onAction?.(`【互动：与【${companion.name}】交谈，了解她对当前局势的看法与建议】`)
        break
      case 'share_food':
        onAction?.(`【互动：从背包取出高能口粮与水，递给【${companion.name}】一同分食】`)
        break
      case 'tactics':
        onAction?.(`【互动：与【${companion.name}】并肩戒备，商议战术协同与后背防御】`)
        break
      case 'probe':
        onAction?.(`【互动：暗中试探【${companion.name}】的态度，探寻隐藏线索】`)
        break
      default:
        break
    }
    onClose()
  }

  const affinityPct = Math.min(100, Math.max(0, companion.affinity))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl frosted-theme-card rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] p-4 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-500/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-xl shadow-inner">
              {companion.avatar || '👥'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {companion.name}
                </h3>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200">
                  {companion.title || '随行同伴'}
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80">
                关系状态: <span className="text-white font-medium">{companion.relation || '信赖'}</span> · 当前: {companion.status || '正常戒备'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg"
            title="关闭"
          >
            ✕
          </button>
        </div>

        {/* 多同伴快速切换标签栏 */}
        {companions && companions.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 border-b border-purple-500/20 custom-scrollbar flex-shrink-0">
            {companions.map((c) => {
              const isSelected = c.name === companion.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onSelectCompanion?.(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                      : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 border border-purple-500/20'
                  }`}
                >
                  <span className="text-sm">{c.avatar || '👥'}</span>
                  <span>{c.name}</span>
                  <span className="text-[10px] text-rose-300 font-mono">❤️{c.affinity}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar flex-grow text-xs">
          {/* Affinity Meter */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-200 flex items-center gap-1">
                ❤️ 羁绊好感度
              </span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {companion.affinity} / 100
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${affinityPct}%` }}
              />
            </div>
            <p className="text-[10px] text-purple-300/70">
              提示：赠送礼物、战术舍身援护或触发关键心扉对话可显著提升好感度与信任层级
            </p>
          </div>

          {/* Traits if available */}
          {companion.traits && companion.traits.length > 0 && (
            <div>
              <div className="font-bold text-purple-200 mb-2 flex items-center gap-1.5">
                <span>✦</span>
                <span>核心特长与天赋词条</span>
              </div>
              <div className="space-y-1.5">
                {companion.traits.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-black/40 border border-purple-500/20 flex items-center gap-2"
                  >
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-500/40 text-purple-300">
                      [{t.grade}]
                    </span>
                    <span className="font-medium text-slate-200">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classified Intel Section */}
          {companion.classifiedIntel ? (
            <div>
              <div className="font-bold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <span>🔍</span>
                <span>观测机密档案</span>
              </div>
              <ClassifiedIntel
                trigger={companion.classifiedIntel.trigger}
                detail={companion.classifiedIntel.detail}
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 italic text-center">
              暂无深度机密情报被揭露（需在剧情中进行智力/侦察检定判定通过）
            </div>
          )}

          {/* Interactive Actions Grid */}
          <div>
            <div className="font-bold text-purple-200 mb-2 flex items-center gap-1.5">
              <span>💬</span>
              <span>快速互动指令</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInteract('talk')}
                className="p-2.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 font-bold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>💬</span>
                <span>交谈谈心</span>
              </button>
              <button
                onClick={() => handleInteract('share_food')}
                className="p-2.5 rounded-xl bg-orange-950/50 hover:bg-orange-900/60 border border-orange-500/30 text-orange-200 font-bold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🍞</span>
                <span>分享干粮与水</span>
              </button>
              <button
                onClick={() => handleInteract('tactics')}
                className="p-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 font-bold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🛡️</span>
                <span>商讨协同掩护</span>
              </button>
              <button
                onClick={() => handleInteract('probe')}
                className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 font-bold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🔍</span>
                <span>试探隐秘线索</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-purple-500/20 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            返回冒险
          </button>
        </div>
      </div>
    </div>
  )
}

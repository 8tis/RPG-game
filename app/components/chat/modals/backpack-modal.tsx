'use client'

import React from 'react'
import type { InventoryItem, EquipmentItem } from '@/hooks/use-game-hud-state'

interface BackpackModalProps {
  isOpen: boolean
  onClose: () => void
  inventory: InventoryItem[]
  equipment: EquipmentItem[]
  currency: number
  currencyName: string
  onAction?: (actionText: string) => void
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equipment,
  currency,
  currencyName,
  onAction,
}) => {
  if (!isOpen) return null

  const handleUseItem = (item: InventoryItem) => {
    onAction?.(`【行动：从随身背包中取出并使用道具【${item.name}】】`)
    onClose()
  }

  const handleInspectItem = (item: InventoryItem) => {
    onAction?.(`【行动：仔细检查随身道具【${item.name}】的具体属性与隐藏线索】`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl frosted-theme-card rounded-2xl border border-white/10 shadow-2xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎒</span>
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
              随身背包与战术行囊
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              容量: {inventory.length}/20
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
              🪙 {currency} <span className="text-[11px] font-normal text-yellow-200/80">{currencyName}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar flex-grow">
          {/* Equipment Quick Strip */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>⚔️</span>
              <span>已佩戴装备</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {equipment.map((eq, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-400 text-[11px]">[{eq.slot}]</span>
                  <span className="font-bold text-[#E6ECE8] truncate max-w-[120px]">{eq.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Items List */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📦</span>
              <span>行囊物资清单</span>
            </div>
            {inventory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                背包空空如也，可在剧情中搜刮物资或在主神商店兑换
              </div>
            ) : (
              <div className="space-y-2">
                {inventory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm shrink-0 border border-white/10">
                        📦
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          物资储备 · 剧情消耗品
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono font-bold text-amber-300 text-xs">
                        x{item.count}
                      </span>
                      <button
                        onClick={() => handleUseItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        title="立即在剧情中使用"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => handleInspectItem(item)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                        title="检查道具"
                      >
                        检查
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>提示：点击“使用”将把操作封装为当前冒险指令直接推进剧情</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            完成整理
          </button>
        </div>
      </div>
    </div>
  )
}

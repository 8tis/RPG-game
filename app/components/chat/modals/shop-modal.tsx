'use client'

import React, { useState } from 'react'

interface ShopItem {
  id: string
  name: string
  category: string
  price: number
  desc: string
  icon: string
  rank?: string
}

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'med_spray',
    name: '高能纳米止血喷雾',
    category: '医疗恢复',
    price: 50,
    desc: '主神空间基础急救品，喷涂后快速凝固恶性外伤，恢复 35% HP',
    icon: '🧪',
  },
  {
    id: 'ration_pack',
    name: '高维压缩浓缩口粮包',
    category: '生存物资',
    price: 15,
    desc: '提供高能量维持，完全恢复 SP/饱食度，并消除轻度疲惫状态',
    icon: '🍞',
  },
  {
    id: 'ammo_9mm',
    name: '9mm高穿透达姆弹匣 (x30)',
    category: '战术弹药',
    price: 25,
    desc: '对丧尸与变异生物具有极佳的停止作用与骨骼碎裂效果',
    icon: '🎯',
  },
  {
    id: 'tac_knife',
    name: '振动合金战术短刃',
    category: '超凡武器',
    price: 150,
    rank: 'D级支线',
    desc: '高频微振动刃口，可轻松切开III级防弹钢板与骨质硬壳',
    icon: '🗡️',
  },
  {
    id: 'gauss_pistol',
    name: '小型战术高斯手枪',
    category: '超凡武器',
    price: 350,
    rank: 'D级支线',
    desc: '电磁轨道加速击发，静音超音速弹道，射程 200米，穿甲破障极强',
    icon: '🔫',
  },
  {
    id: 'nano_vest',
    name: '纳米防刺防弹作战背心',
    category: '防具防护',
    price: 200,
    desc: '有效抵御常规枪弹直击与怪物爪牙撕扯，大幅减免物理伤害',
    icon: '🛡️',
  },
  {
    id: 'san_pill',
    name: '超感神经稳定剂',
    category: '精神抗性',
    price: 80,
    desc: '针对不可名状与认知污染，立刻恢复 40点 SAN 理智值',
    icon: '💊',
  },
  {
    id: 't_virus_antidote',
    name: '蜂巢T病毒特效解毒血清',
    category: '病毒免疫',
    price: 120,
    desc: '注射后清除体内初级生化感染与尸毒潜伏期，免疫持续 24小时',
    icon: '💉',
  },
]

interface ShopModalProps {
  isOpen: boolean
  onClose: () => void
  currency: number
  currencyName: string
  onAction?: (actionText: string) => void
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  currency,
  currencyName,
  onAction,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('全部')

  if (!isOpen) return null

  const categories = ['全部', '医疗恢复', '超凡武器', '战术弹药', '防具防护', '精神抗性']

  const filteredItems = activeCategory === '全部'
    ? DEFAULT_SHOP_ITEMS
    : DEFAULT_SHOP_ITEMS.filter(item => item.category === activeCategory)

  const handleBuy = (item: ShopItem) => {
    onAction?.(`【主神兑换：消耗 ${item.price} ${currencyName} 兑换【${item.name}】，立即装配至随身行囊】`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl frosted-theme-card rounded-2xl border border-white/10 shadow-2xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                主神空间 · 位面兑换枢纽
              </h3>
              <p className="text-[11px] text-slate-400">
                因果律物资兑换，扣除点数后直接具现至宿主背包
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(250,204,21,0.15)]">
              <span>🪙 当前储备:</span>
              <span className="text-sm">{currency}</span>
              <span className="text-[11px] opacity-80">{currencyName}</span>
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 pb-2 mb-2 overflow-x-auto flex-shrink-0 custom-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Shop Items Grid */}
        <div className="overflow-y-auto space-y-2.5 pr-1 custom-scrollbar flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const canAfford = currency >= item.price
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-800 border border-white/10 shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {item.name}
                        </span>
                        {item.rank && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                            {item.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="font-mono font-bold text-yellow-400 flex items-center gap-1">
                      🪙 {item.price} <span className="text-[10px] text-slate-400 font-normal">{currencyName}</span>
                    </span>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30 hover:brightness-125 text-yellow-300 border border-yellow-500/40 active:scale-95 shadow-sm'
                          : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? '立即兑换' : '点数不足'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>提示：兑换结果将记录于当前轮回世界线，并作为剧情支线收益生效</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            离开商城
          </button>
        </div>
      </div>
    </div>
  )
}

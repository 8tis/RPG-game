'use client'

import React, { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import {
  ChevronDownIcon,
  CheckIcon,
  CpuChipIcon,
  SparklesIcon,
  BoltIcon,
  CommandLineIcon,
} from '@heroicons/react/24/solid'
import type { ModelOption } from '@/service/models'
import { modelsApi, getStoredModelId, setStoredModelId } from '@/service/models'
import Toast from '@/app/components/base/toast'

interface ModelSelectorProps {
  conversationId?: string
  className?: string
}

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    badge: '推荐',
    color: 'emerald',
    desc: '极具叙事张力与沉浸感，文风深厚细腻',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'deepseek-ai/DeepSeek-V3.2',
  },
  {
    id: 'qwen-27b',
    name: 'Qwen 3.6 27B',
    badge: '极速',
    color: 'cyan',
    desc: '响应极速顺滑，剧情推进紧凑干脆',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'Qwen/Qwen3.6-27B',
  },
  {
    id: 'qwen-72b',
    name: 'Qwen 2.5 72B',
    badge: '旗舰',
    color: 'amber',
    desc: '720亿旗舰超大模型，逻辑推演与世界观严谨',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'Qwen/Qwen2.5-72B-Instruct',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    badge: '深度推演',
    color: 'purple',
    desc: '满血深度思考模型，长链逻辑与死局破解极强',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'deepseek-ai/DeepSeek-R1',
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    badge: '闪电',
    color: 'blue',
    desc: '谷歌次世代闪电响应引擎，秒级实时出字',
    provider: 'langgenius/gemini/google',
    model_name: 'gemini-2.0-flash',
  },
]

export const ModelSelector: FC<ModelSelectorProps> = ({ conversationId, className }) => {
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS)
  const [currentModelId, setCurrentModelId] = useState<string>('deepseek-v3')
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. 初始化拉取并同步可用模型与当前选中状态
  useEffect(() => {
    const init = async () => {
      try {
        const data = await modelsApi.getModels()
        if (data.models && data.models.length > 0) {
          setModels(data.models)
        }
        const stored = getStoredModelId()
        if (stored && data.models.some(m => m.id === stored)) {
          setCurrentModelId(stored)
        } else if (data.current_model_id) {
          setCurrentModelId(data.current_model_id)
        }
      } catch (e) {
        // 后备使用本地存储或默认值
        const stored = getStoredModelId()
        if (stored) setCurrentModelId(stored)
      }
    }
    init()
  }, [])

  // 2. 外部点击自动关闭下拉浮层
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const currentModel = models.find(m => m.id === currentModelId) || models[0] || DEFAULT_MODELS[0]

  const handleSelectModel = async (model: ModelOption) => {
    if (model.id === currentModelId || isSwitching) return
    setIsSwitching(true)
    try {
      await modelsApi.switchModel(model.id, conversationId)
      setCurrentModelId(model.id)
      setStoredModelId(model.id)
      Toast.notify({
        type: 'success',
        message: `神经演算核心已切换至 [${model.name}]`,
        duration: 3000,
      })
      setIsOpen(false)
    } catch (err: any) {
      Toast.notify({
        type: 'error',
        message: `切换模型失败: ${err?.message || '网络异常'}`,
        duration: 4000,
      })
    } finally {
      setIsSwitching(false)
    }
  }

  // 动态品质颜色映射
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          pill: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:border-emerald-300',
          dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
          badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
        }
      case 'cyan':
        return {
          pill: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:border-cyan-300',
          dot: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
          badge: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
        }
      case 'purple':
        return {
          pill: 'bg-purple-500/15 border-purple-400/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] hover:border-purple-300',
          dot: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
          badge: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
        }
      case 'amber':
        return {
          pill: 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
          badge: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
        }
      case 'blue':
      default:
        return {
          pill: 'bg-blue-500/15 border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)] hover:border-blue-300',
          dot: 'bg-blue-400 shadow-[0_0_6px_#60a5fa]',
          badge: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
        }
    }
  }

  const activeColor = getColorClasses(currentModel.color)

  return (
    <div className={cn('relative z-30 select-none', className)} ref={containerRef}>
      {/* 赛博风格胶囊按钮 (参考原版设计：GEMINI-3-FLASH-PREVIEW 居中胶囊) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={cn(
          'flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer text-xs font-mono font-bold tracking-wider',
          activeColor.pill,
          isSwitching && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className={cn('w-2 h-2 rounded-full animate-pulse', activeColor.dot)} />
        <span className="truncate max-w-[110px] sm:max-w-[160px] uppercase">
          {currentModel.name}
        </span>
        <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-sans border hidden md:inline-block', activeColor.badge)}>
          {currentModel.badge}
        </span>
        <ChevronDownIcon
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-gray-400',
            isOpen && 'transform rotate-180 text-white',
          )}
        />
      </button>

      {/* 下拉模型菜单 */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#14171d]/95 backdrop-blur-xl border border-[#343b44] shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-2 animate-fade-in z-50">
          {/* 标头 */}
          <div className="px-3 py-2 border-b border-[#252a33] flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#E6ECE8] tracking-wide">
              <CpuChipIcon className="w-4 h-4 text-[#70D8E0]" />
              <span>神经演算架构选择</span>
            </div>
            <span className="text-[10px] font-mono text-[#849396]">NEURAL_CORE</span>
          </div>

          {/* 模型卡片列表 */}
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
            {models.map((model) => {
              const isSelected = model.id === currentModelId
              const itemColor = getColorClasses(model.color)
              return (
                <div
                  key={model.id}
                  role="button"
                  onClick={() => handleSelectModel(model)}
                  className={cn(
                    'group p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3',
                    isSelected
                      ? 'bg-[#1b212c] border-[#70D8E0]/60 shadow-[0_0_12px_rgba(112,216,224,0.15)]'
                      : 'bg-[#181c22]/60 border-transparent hover:bg-[#1f242c] hover:border-[#38414e]',
                  )}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold text-xs font-mono', isSelected ? 'text-white' : 'text-[#d4dde2] group-hover:text-white')}>
                        {model.name}
                      </span>
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0', itemColor.badge)}>
                        {model.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#849396] leading-relaxed line-clamp-2">
                      {model.desc}
                    </div>
                  </div>

                  <div className="pt-0.5 shrink-0">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#70D8E0]/20 border border-[#70D8E0] flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-[#70D8E0]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-600/40 group-hover:border-gray-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部提示 */}
          <div className="mt-2 pt-2 border-t border-[#252a33] px-2 text-[10px] text-[#6b7780] flex items-center justify-between">
            <span>支持多位面无缝热切</span>
            <span className="text-[#849396]">实时因果演算生效</span>
          </div>
        </div>
      )}
    </div>
  )
}

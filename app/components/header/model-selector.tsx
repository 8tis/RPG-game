'use client'

import React, { FC, useState, useEffect, useRef, useMemo } from 'react'
import cn from 'classnames'
import {
  ChevronDownIcon,
  CheckIcon,
  CpuChipIcon,
  SparklesIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import type { ModelOption, CategoryOption } from '@/service/models'
import { modelsApi, getStoredModelId, setStoredModelId } from '@/service/models'
import Toast from '@/app/components/base/toast'

interface ModelSelectorProps {
  conversationId?: string
  className?: string
}

const DEFAULT_FEATURED_MODELS: ModelOption[] = [
  {
    id: 'siliconflow:deepseek-ai/DeepSeek-V3.2',
    name: 'DeepSeek-V3.2',
    badge: '推荐',
    color: 'emerald',
    desc: '超强叙事张力与沉浸感，文风深厚细腻，擅长生死决断',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'deepseek-ai/DeepSeek-V3.2',
    category: 'siliconflow',
    category_name: '硅基流动 (SiliconFlow)',
    is_featured: true,
  },
  {
    id: 'google:gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: '闪电',
    color: 'blue',
    desc: '谷歌次世代闪电响应引擎，秒级实时极速出字',
    provider: 'langgenius/gemini/google',
    model_name: 'gemini-3-flash-preview',
    category: 'google',
    category_name: '谷歌 (Google Gemini)',
    is_featured: true,
  },
  {
    id: 'siliconflow:Qwen/Qwen3.6-27B',
    name: 'Qwen 3.6 27B',
    badge: '极速',
    color: 'cyan',
    desc: '响应极速顺滑，剧情推进紧凑干脆',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'Qwen/Qwen3.6-27B',
    category: 'siliconflow',
    category_name: '硅基流动 (SiliconFlow)',
    is_featured: true,
  },
  {
    id: 'siliconflow:deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1',
    badge: '深度推演',
    color: 'purple',
    desc: '满血深度思考模型，长链逻辑与死局破解极强',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'deepseek-ai/DeepSeek-R1',
    category: 'siliconflow',
    category_name: '硅基流动 (SiliconFlow)',
    is_featured: true,
  },
  {
    id: 'tongyi:qwen-max',
    name: 'Qwen-Max',
    badge: '旗舰',
    color: 'amber',
    desc: '通义千问旗舰级超大模型，综合推理与复杂世界观演义',
    provider: 'langgenius/tongyi/tongyi',
    model_name: 'qwen-max',
    category: 'tongyi',
    category_name: '阿里通义 (Tongyi)',
    is_featured: true,
  },
  {
    id: 'google:gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: '旗舰',
    color: 'blue',
    desc: '谷歌旗舰多模态大模型，长上下文理解与深度决策',
    provider: 'langgenius/gemini/google',
    model_name: 'gemini-2.5-pro',
    category: 'google',
    category_name: '谷歌 (Google Gemini)',
    is_featured: true,
  },
  {
    id: 'tongyi:kimi-k2.5',
    name: 'Kimi-K2.5',
    badge: '长文交互',
    color: 'amber',
    desc: '超长上下文深度拟人交互，细腻情绪与角色对话',
    provider: 'langgenius/tongyi/tongyi',
    model_name: 'kimi-k2.5',
    category: 'tongyi',
    category_name: '阿里通义 (Tongyi)',
    is_featured: true,
  },
  {
    id: 'siliconflow:zai-org/GLM-5.2',
    name: 'GLM-5.2',
    badge: '智谱清言',
    color: 'emerald',
    desc: '智谱新一代推理引擎，扎实的中文叙事与战局推演',
    provider: 'langgenius/siliconflow/siliconflow',
    model_name: 'zai-org/GLM-5.2',
    category: 'siliconflow',
    category_name: '硅基流动 (SiliconFlow)',
    is_featured: true,
  },
]

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'featured', name: '🔥 常用精选' },
  { id: 'google', name: '🌐 谷歌 (Gemini)' },
  { id: 'siliconflow', name: '⚡ 硅基流动' },
  { id: 'tongyi', name: '☁️ 阿里通义' },
  { id: 'all', name: '全部模型' },
]

export const ModelSelector: FC<ModelSelectorProps> = ({ conversationId, className }) => {
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_FEATURED_MODELS)
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES)
  const [activeCategory, setActiveCategory] = useState<string>('featured')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentModelId, setCurrentModelId] = useState<string>('siliconflow:deepseek-ai/DeepSeek-V3.2')
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. 初始化拉取并同步后端真实模型列表与当前选中状态
  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const data = await modelsApi.getModels(conversationId)
        if (!isMounted) return
        if (data.models && data.models.length > 0) {
          setModels(data.models)
        }
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories)
        }
        const stored = getStoredModelId()
        if (stored && data.models?.some(m => m.id === stored || m.model_name === stored)) {
          const matched = data.models.find(m => m.id === stored || m.model_name === stored)
          if (matched) setCurrentModelId(matched.id)
        } else if (data.current_model_id) {
          setCurrentModelId(data.current_model_id)
        }
      } catch (e) {
        const stored = getStoredModelId()
        if (stored) setCurrentModelId(stored)
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [conversationId])

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

  // 3. 打开浮层时自动聚焦搜索输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // 寻找当前选中的模型对象（支持兼容旧 id 如 deepseek-v3）
  const currentModel = useMemo(() => {
    const exact = models.find(m => m.id === currentModelId)
    if (exact) return exact
    const byName = models.find(m => m.model_name === currentModelId || m.name === currentModelId)
    if (byName) return byName
    // 兼容 legacy id
    if (currentModelId === 'deepseek-v3') {
      return models.find(m => m.model_name.includes('DeepSeek-V3')) || models[0]
    }
    if (currentModelId === 'qwen-27b') {
      return models.find(m => m.model_name.includes('Qwen3.6-27B')) || models[0]
    }
    if (currentModelId === 'gemini-flash') {
      return models.find(m => m.model_name.includes('gemini-3-flash') || m.model_name.includes('gemini-2.0-flash')) || models[0]
    }
    return models[0] || DEFAULT_FEATURED_MODELS[0]
  }, [models, currentModelId])

  // 过滤当前展示的模型列表
  const filteredModels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    // 当输入关键词搜索时，在全部 101 个模型中全局搜索，体验最流畅
    if (query) {
      return models.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.model_name.toLowerCase().includes(query) ||
        m.badge.toLowerCase().includes(query) ||
        m.category_name.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query)
      )
    }

    // 未搜索时，按所选分类 Tab 过滤
    if (activeCategory === 'featured') {
      return models.filter(m => m.is_featured)
    }
    if (activeCategory === 'all') {
      return models
    }
    return models.filter(m => m.category === activeCategory)
  }, [models, activeCategory, searchQuery])

  // 执行模型热切换
  const handleSelectModel = async (model: ModelOption) => {
    if (model.id === currentModel.id || isSwitching) return
    setIsSwitching(true)
    try {
      const res = await modelsApi.switchModel(model.id, conversationId)
      setCurrentModelId(model.id)
      setStoredModelId(model.id)
      Toast.notify({
        type: 'success',
        message: `神经演算核心已实时同步至 [${model.name}]`,
        duration: 3500,
      })
      setIsOpen(false)
    } catch (err: any) {
      Toast.notify({
        type: 'error',
        message: `切换模型架构失败: ${err?.message || '网络异常'}`,
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
          activeBorder: 'border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.2)] bg-emerald-950/20',
        }
      case 'cyan':
        return {
          pill: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:border-cyan-300',
          dot: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
          badge: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
          activeBorder: 'border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.2)] bg-cyan-950/20',
        }
      case 'purple':
        return {
          pill: 'bg-purple-500/15 border-purple-400/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] hover:border-purple-300',
          dot: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
          badge: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
          activeBorder: 'border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.2)] bg-purple-950/20',
        }
      case 'amber':
        return {
          pill: 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
          badge: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
          activeBorder: 'border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.2)] bg-amber-950/20',
        }
      case 'blue':
      default:
        return {
          pill: 'bg-blue-500/15 border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)] hover:border-blue-300',
          dot: 'bg-blue-400 shadow-[0_0_6px_#60a5fa]',
          badge: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
          activeBorder: 'border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.2)] bg-blue-950/20',
        }
    }
  }

  const activeColor = getColorClasses(currentModel?.color || 'blue')

  return (
    <div className={cn('relative z-30 select-none', className)} ref={containerRef}>
      {/* 赛博风格顶栏居中胶囊按钮 (如 GEMINI-3-FLASH-PREVIEW ▼) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer text-xs font-mono font-bold tracking-wider',
          activeColor.pill,
          isSwitching && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className={cn('w-2 h-2 rounded-full animate-pulse', activeColor.dot)} />
        <span className="truncate max-w-[120px] sm:max-w-[190px] uppercase">
          {currentModel?.name || 'NEURAL CORE'}
        </span>
        <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-sans border hidden sm:inline-block', activeColor.badge)}>
          {currentModel?.badge || '推荐'}
        </span>
        <ChevronDownIcon
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-gray-400',
            isOpen && 'transform rotate-180 text-white',
          )}
        />
      </button>

      {/* 下拉模型弹窗面板 */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[92vw] sm:w-[480px] md:w-[520px] rounded-2xl bg-[#14171d]/95 backdrop-blur-2xl border border-[#343b44] shadow-[0_16px_48px_rgba(0,0,0,0.7)] p-3 animate-fade-in z-50">
          {/* 标头 */}
          <div className="px-2 pb-2.5 border-b border-[#252a33] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E6ECE8] tracking-wide">
              <CpuChipIcon className="w-4 h-4 text-[#70D8E0]" />
              <span>神经演算架构选择</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#70D8E0]/15 text-[#70D8E0] font-mono border border-[#70D8E0]/30">
                {models.length} MODELS
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#849396] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>后端实时同步中</span>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mt-2.5 relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模型名称、提供商 (如 gemini, deepseek, qwen, kimi, glm)..."
              className="w-full bg-[#181d26] border border-[#2e3745] focus:border-[#70D8E0] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#70D8E0]/50 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 分类过滤器 Tab 标签 */}
          {!searchQuery && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-150 border',
                      isActive
                        ? 'bg-[#70D8E0]/20 border-[#70D8E0] text-[#70D8E0] shadow-[0_0_8px_rgba(112,216,224,0.25)] font-bold'
                        : 'bg-[#181c22]/80 border-[#2b3340] text-gray-400 hover:text-gray-200 hover:border-gray-500',
                    )}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* 模型卡片滚动列表 */}
          <div className="mt-2.5 space-y-1.5 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1">
            {filteredModels.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                <CpuChipIcon className="w-8 h-8 text-gray-600 mx-auto opacity-50" />
                <div>未找到匹配的模型架构</div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#70D8E0] hover:underline text-[11px]"
                  >
                    清除搜索词
                  </button>
                )}
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = model.id === currentModel?.id || model.model_name === currentModel?.model_name
                const itemColor = getColorClasses(model.color)
                return (
                  <div
                    key={model.id}
                    role="button"
                    onClick={() => handleSelectModel(model)}
                    className={cn(
                      'group p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3',
                      isSelected
                        ? itemColor.activeBorder
                        : 'bg-[#181c22]/70 border-[#272f3d] hover:bg-[#1f2633] hover:border-[#3d495c]',
                    )}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      {/* 模型标题行 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-bold text-xs font-mono', isSelected ? 'text-white' : 'text-[#d4dde2] group-hover:text-white')}>
                          {model.name}
                        </span>
                        <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-medium border shrink-0', itemColor.badge)}>
                          {model.badge}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[130px]">
                          {model.category_name}
                        </span>
                      </div>

                      {/* 描述信息 */}
                      <div className="text-[11px] text-[#849396] leading-relaxed line-clamp-2">
                        {model.desc}
                      </div>

                      {/* 原生模型代号 */}
                      <div className="text-[9px] font-mono text-gray-500 truncate">
                        ID: {model.model_name}
                      </div>
                    </div>

                    {/* 勾选状态指示器 */}
                    <div className="pt-1 shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#70D8E0]/20 border border-[#70D8E0] flex items-center justify-center">
                          <CheckIcon className="w-3.5 h-3.5 text-[#70D8E0]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-600/40 group-hover:border-gray-400" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 底部信息提示栏 */}
          <div className="mt-2.5 pt-2 border-t border-[#252a33] px-1 text-[10px] text-[#6b7780] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <BoltIcon className="w-3 h-3 text-[#70D8E0]" />
              <span>多位面实时因果热切换已激活</span>
            </span>
            <span className="text-[#849396] font-mono">DIFY ENGINE 2026</span>
          </div>
        </div>
      )}
    </div>
  )
}

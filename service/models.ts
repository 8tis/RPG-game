/**
 * RPG Model Selection API Client
 */

export interface ModelOption {
  id: string
  name: string
  raw_name?: string
  badge: string
  color: 'emerald' | 'cyan' | 'amber' | 'purple' | 'blue' | string
  desc: string
  provider: string
  model_name: string
  category: 'google' | 'siliconflow' | 'tongyi' | string
  category_name: string
  is_featured?: boolean
}

export interface CategoryOption {
  id: string
  name: string
  count?: number
}

export interface ModelsResponseData {
  current_model_id: string
  current_model?: ModelOption
  categories: CategoryOption[]
  featured_models: ModelOption[]
  models: ModelOption[]
}

export const modelsApi = {
  getModels: async (conversationId?: string): Promise<ModelsResponseData> => {
    const url = conversationId && conversationId !== '-1'
      ? `/api/rpg/models?conversation_id=${encodeURIComponent(conversationId)}`
      : '/api/rpg/models'
    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()
    if (json.code !== 0) throw new Error(json.msg || '获取神经模型列表失败')
    return json.data
  },

  switchModel: async (modelId: string, conversationId?: string): Promise<{ model_id: string; model_name: string; config_id: string; model?: ModelOption }> => {
    const res = await fetch('/api/rpg/models/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_id: modelId,
        conversation_id: conversationId && conversationId !== '-1' ? conversationId : undefined,
      }),
    })
    const json = await res.json()
    if (json.code !== 0) throw new Error(json.msg || '切换神经模型架构失败')
    return json.data
  },
}

const STORED_MODEL_KEY = 'rpg_selected_model_id'

export const getStoredModelId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORED_MODEL_KEY)
}

export const setStoredModelId = (modelId: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORED_MODEL_KEY, modelId)
}

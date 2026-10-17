/**
 * RPG Auth & Points API Client
 */

export interface RPGUser {
  id: number
  username: string
  points: number
  total_tokens_consumed: number
  status: 'active' | 'banned'
  is_admin: boolean
  created_at?: string
  updated_at?: string
}

export interface PointsLog {
  id: number
  user_id?: number
  change_type: 'initial_bonus' | 'chat_consumption' | 'admin_adjustment' | 'recharge' | string
  points_change: number
  tokens_consumed: number
  balance_after: number
  remark?: string
  created_at: string
}

export interface AdminStats {
  total_users: number
  total_points: number
  total_tokens: number
}

const TOKEN_KEY = 'rpg_auth_token'
const USER_KEY = 'rpg_auth_user'

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export const getStoredUser = (): RPGUser | null => {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const setStoredAuth = (token: string, user: RPGUser) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function requestApi<T>(path: string, options: RequestInit = {}, adminKey?: string): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey
  }

  const res = await fetch(`/api/rpg/${path}`, {
    ...options,
    headers,
  })

  const json = await res.json()
  if (!res.ok || json.code !== 0) {
    const errorMsg = json.detail || json.msg || '网络请求错误'
    throw new Error(errorMsg)
  }
  return json.data as T
}

export const authApi = {
  // User Auth
  async register(username: string, password: string): Promise<{ token: string; user: RPGUser }> {
    return requestApi<{ token: string; user: RPGUser }>('auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async login(username: string, password: string): Promise<{ token: string; user: RPGUser }> {
    return requestApi<{ token: string; user: RPGUser }>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async getProfile(): Promise<RPGUser> {
    return requestApi<RPGUser>('user/profile', {
      method: 'GET',
    })
  },

  async deductPoints(tokens: number, remark?: string): Promise<{ points_deducted: number; remaining_points: number; total_tokens_consumed: number }> {
    return requestApi<{ points_deducted: number; remaining_points: number; total_tokens_consumed: number }>('user/deduct-points', {
      method: 'POST',
      body: JSON.stringify({ tokens, remark }),
    })
  },

  async getUserLogs(page = 1, pageSize = 20): Promise<PointsLog[]> {
    return requestApi<PointsLog[]>(`user/logs?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
    })
  },

  // Admin API
  async adminVerify(adminKey: string): Promise<boolean> {
    try {
      await requestApi<any>('admin/verify', { method: 'POST' }, adminKey)
      return true
    } catch {
      return false
    }
  },

  async adminGetStats(adminKey: string): Promise<AdminStats> {
    return requestApi<AdminStats>('admin/stats', { method: 'GET' }, adminKey)
  },

  async adminGetUsers(adminKey: string, search = '', page = 1, pageSize = 50): Promise<{ total: number; page: number; page_size: number; users: RPGUser[] }> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    return requestApi<{ total: number; page: number; page_size: number; users: RPGUser[] }>(
      `admin/users?page=${page}&page_size=${pageSize}${searchParam}`,
      { method: 'GET' },
      adminKey
    )
  },

  async adminAdjustPoints(adminKey: string, userId: number, pointsChange: number, remark?: string): Promise<{ user_id: number; points_change: number; balance_after: number }> {
    return requestApi<{ user_id: number; points_change: number; balance_after: number }>(
      'admin/adjust-points',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, points_change: pointsChange, remark }),
      },
      adminKey
    )
  },

  async adminUpdateStatus(adminKey: string, userId: number, status: 'active' | 'banned'): Promise<RPGUser> {
    return requestApi<RPGUser>(
      'admin/update-status',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, status }),
      },
      adminKey
    )
  },

  async adminGetUserLogs(adminKey: string, userId: number, page = 1, pageSize = 50): Promise<PointsLog[]> {
    return requestApi<PointsLog[]>(
      `admin/user-logs?user_id=${userId}&page=${page}&page_size=${pageSize}`,
      { method: 'GET' },
      adminKey
    )
  },
}

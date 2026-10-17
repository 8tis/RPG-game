'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { RPGUser } from '@/service/auth'
import { authApi, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from '@/service/auth'
import Toast from '@/app/components/base/toast'

interface AuthContextType {
  user: RPGUser | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  authModalTab: 'login' | 'register'
  openAuthModal: (tab?: 'login' | 'register') => void
  closeAuthModal: () => void
  isPointsLogModalOpen: boolean
  openPointsLogModal: () => void
  closePointsLogModal: () => void
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  deductUserPoints: (tokens: number, remark?: string) => Promise<{ points_deducted: number; remaining_points: number }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RPGUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')
  const [isPointsLogModalOpen, setIsPointsLogModalOpen] = useState<boolean>(false)

  // Initialize auth from localStorage and sync latest profile
  useEffect(() => {
    const savedToken = getStoredToken()
    const savedUser = getStoredUser()

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(savedUser)
      // fetch latest points balance from server
      authApi.getProfile()
        .then((latestUser) => {
          setUser(latestUser)
          setStoredAuth(savedToken, latestUser)
        })
        .catch((err) => {
          // If token expired or user banned
          if (err?.message?.includes('凭证') || err?.message?.includes('token') || err?.message?.includes('401')) {
            clearStoredAuth()
            setUser(null)
            setToken(null)
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const openPointsLogModal = useCallback(() => {
    setIsPointsLogModalOpen(true)
  }, [])

  const closePointsLogModal = useCallback(() => {
    setIsPointsLogModalOpen(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    setToken(res.token)
    setUser(res.user)
    setStoredAuth(res.token, res.user)
    closeAuthModal()
    Toast.notify({ type: 'success', message: `欢迎回归主神空间，轮回者【${res.user.username}】！当前积分: ${res.user.points}` })
  }, [closeAuthModal])

  const register = useCallback(async (username: string, password: string) => {
    const res = await authApi.register(username, password)
    setToken(res.token)
    setUser(res.user)
    setStoredAuth(res.token, res.user)
    closeAuthModal()
    Toast.notify({ type: 'success', message: `新轮回者【${res.user.username}】契约建立成功！已发放 2,000 点初始轮回积分！` })
  }, [closeAuthModal])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    setToken(null)
    Toast.notify({ type: 'info', message: '已断开与主神空间的神经连接' })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!token) return
    try {
      const latestUser = await authApi.getProfile()
      setUser(latestUser)
      setStoredAuth(token, latestUser)
    } catch (e) {
      // profile refresh error
    }
  }, [token])

  const deductUserPoints = useCallback(async (tokens: number, remark?: string) => {
    if (!token) {
      throw new Error('未登入')
    }
    const res = await authApi.deductPoints(tokens, remark)
    setUser((prev) => {
      if (!prev) return null
      const updated: RPGUser = {
        ...prev,
        points: res.remaining_points,
        total_tokens_consumed: res.total_tokens_consumed,
      }
      setStoredAuth(token, updated)
      return updated
    })
    return {
      points_deducted: res.points_deducted,
      remaining_points: res.remaining_points,
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isPointsLogModalOpen,
        openPointsLogModal,
        closePointsLogModal,
        login,
        register,
        logout,
        refreshProfile,
        deductUserPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

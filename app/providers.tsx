'use client'

import React, { useEffect } from 'react'
import { AuthProvider } from '@/context/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 监听 Next.js 部署更新时发生的旧 Chunk 404 错误并自动清除缓存重载
    const handleChunkError = (e: ErrorEvent) => {
      const msg = e?.message || ''
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('failed to fetch dynamically imported module')
      ) {
        const lastReload = sessionStorage.getItem('chunk_reload_retry')
        if (!lastReload) {
          sessionStorage.setItem('chunk_reload_retry', '1')
          window.location.reload()
        }
      }
    }

    window.addEventListener('error', handleChunkError)
    return () => {
      window.removeEventListener('error', handleChunkError)
    }
  }, [])

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

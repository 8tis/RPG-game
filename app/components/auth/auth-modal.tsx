'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { XMarkIcon, SparklesIcon, ShieldCheckIcon, KeyIcon, UserIcon, ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!username.trim()) {
      setErrorMsg('请输入轮回者代号')
      return
    }
    if (password.length < 6) {
      setErrorMsg('神经秘钥（密码）长度不得少于 6 位')
      return
    }

    setIsSubmitting(true)
    try {
      if (authModalTab === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      setUsername('')
      setPassword('')
    } catch (err: any) {
      setErrorMsg(err?.message || '操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#16191f] border border-[#70D8E0]/40 rounded-2xl shadow-[0_0_35px_rgba(112,216,224,0.18)] p-6 sm:p-8 text-[#E6ECE8] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#70D8E0]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#849396] hover:text-[#70D8E0] hover:bg-[#25292f] transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#25292f] border border-[#70D8E0]/30 shadow-[0_0_12px_rgba(112,216,224,0.2)]">
            <SparklesIcon className="w-6 h-6 text-[#70D8E0]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#E6ECE8] tracking-wider flex items-center gap-2">
              主神空间终端
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#70D8E0]/15 text-[#70D8E0] border border-[#70D8E0]/30 font-mono">
                SECURE v2.6
              </span>
            </h2>
            <p className="text-xs text-[#849396] mt-0.5">神经链接身份认证与位面法则契约</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#121418] rounded-xl border border-[#2c323b] mb-6">
          <button
            type="button"
            onClick={() => { openAuthModal('login'); setErrorMsg('') }}
            className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-[#25292f] text-[#70D8E0] shadow-sm border border-[#70D8E0]/40'
                : 'text-[#849396] hover:text-[#E6ECE8]'
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1.5" />
            轮回者登入
          </button>
          <button
            type="button"
            onClick={() => { openAuthModal('register'); setErrorMsg('') }}
            className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-[#25292f] text-[#70D8E0] shadow-sm border border-[#70D8E0]/40'
                : 'text-[#849396] hover:text-[#E6ECE8]'
            }`}
          >
            <UserPlusIcon className="w-4 h-4 mr-1.5" />
            建立新契约
          </button>
        </div>

        {/* New Player Bonus Notice (Only on Register Tab) */}
        {authModalTab === 'register' && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
            <span className="text-base leading-none">🎁</span>
            <div>
              <div className="font-bold text-amber-200">主神空间新血福利</div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                新建立契约立即获赠 <span className="font-bold text-amber-400">2,000 点轮回积分</span>（可推演约 200 万 Token）！
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
            <ShieldCheckIcon className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#849396] mb-1.5">
              轮回者代号 (用户名)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#849396]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如：郑吒、楚轩、旅法师..."
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] focus:ring-1 focus:ring-[#70D8E0] rounded-xl text-xs text-[#E6ECE8] placeholder-[#505a63] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#849396] mb-1.5">
              神经秘钥 (密码)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#849396]">
                <KeyIcon className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="不少于 6 位的密码"
                autoComplete={authModalTab === 'login' ? 'current-password' : 'new-password'}
                className="w-full pl-9 pr-3 py-2.5 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] focus:ring-1 focus:ring-[#70D8E0] rounded-xl text-xs text-[#E6ECE8] placeholder-[#505a63] outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#70D8E0] to-[#51a7af] hover:from-[#84e2e9] hover:to-[#5eb9c2] text-[#121418] font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(112,216,224,0.35)] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#121418] border-t-transparent rounded-full animate-spin" />
                  <span>神经同步中...</span>
                </>
              ) : (
                <span>{authModalTab === 'login' ? '立即连接主神空间' : '签订法则契约'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-[#2c323b]/60 flex items-center justify-between text-[11px] text-[#849396]">
          <span>⚡ 汇率：1000 Token = 1 轮回积分</span>
          <a
            href="/admin"
            target="_blank"
            rel="noreferrer"
            className="text-[#70D8E0]/70 hover:text-[#70D8E0] transition-colors hover:underline"
          >
            主神空间中枢 ⚙️
          </a>
        </div>
      </div>
    </div>
  )
}
export default AuthModal

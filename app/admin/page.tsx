'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { RPGUser, PointsLog, AdminStats } from '@/service/auth'
import { authApi } from '@/service/auth'
import Toast from '@/app/components/base/toast'
import {
  ShieldCheckIcon,
  KeyIcon,
  UsersIcon,
  BoltIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  XMarkIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const DEFAULT_ADMIN_KEY = 'rpg_admin_infinity_2026_secret'
const ADMIN_STORAGE_KEY = 'rpg_admin_access_key'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<RPGUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [adjustTargetUser, setAdjustTargetUser] = useState<RPGUser | null>(null)
  const [adjustAmount, setAdjustAmount] = useState<number>(1000)
  const [adjustRemark, setAdjustRemark] = useState<string>('主神空间特批物资')
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false)

  const [logsTargetUser, setLogsTargetUser] = useState<RPGUser | null>(null)
  const [userLogs, setUserLogs] = useState<PointsLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Verify key on mount if saved
  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY) || DEFAULT_ADMIN_KEY
    if (saved) {
      setInputKey(saved)
      authApi.adminVerify(saved)
        .then((valid) => {
          if (valid) {
            setAdminKey(saved)
            setIsAuthorized(true)
          }
        })
        .finally(() => setIsCheckingAuth(false))
    } else {
      setIsCheckingAuth(false)
    }
  }, [])

  // Load stats and users
  const loadData = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const [statsData, usersData] = await Promise.all([
        authApi.adminGetStats(adminKey),
        authApi.adminGetUsers(adminKey, searchTerm, page, pageSize),
      ])
      setStats(statsData)
      setUsers(usersData.users)
      setTotalUsers(usersData.total)
    } catch (e: any) {
      Toast.notify({ type: 'error', message: e?.message || '获取数据失败' })
    } finally {
      setLoading(false)
    }
  }, [adminKey, searchTerm, page, pageSize])

  useEffect(() => {
    if (isAuthorized && adminKey) {
      loadData()
    }
  }, [isAuthorized, adminKey, loadData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputKey.trim()) return
    setLoading(true)
    try {
      const valid = await authApi.adminVerify(inputKey.trim())
      if (valid) {
        localStorage.setItem(ADMIN_STORAGE_KEY, inputKey.trim())
        setAdminKey(inputKey.trim())
        setIsAuthorized(true)
        Toast.notify({ type: 'success', message: '主神空间最高权限中枢验证成功' })
      } else {
        Toast.notify({ type: 'error', message: '权限秘钥无效' })
      }
    } catch {
      Toast.notify({ type: 'error', message: '权限秘钥无效' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    setAdminKey('')
    setIsAuthorized(false)
  }

  // Handle Adjust Points
  const handleOpenAdjust = (target: RPGUser) => {
    setAdjustTargetUser(target)
    setAdjustAmount(1000)
    setAdjustRemark('主神空间特批物资')
  }

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustTargetUser || !adminKey) return
    if (!adjustAmount || isNaN(adjustAmount)) {
      Toast.notify({ type: 'warning', message: '请输入有效的积分变动额' })
      return
    }

    setIsSubmittingAdjust(true)
    try {
      const res = await authApi.adminAdjustPoints(
        adminKey,
        adjustTargetUser.id,
        adjustAmount,
        adjustRemark
      )
      Toast.notify({
        type: 'success',
        message: `成功为【${adjustTargetUser.username}】${adjustAmount >= 0 ? '增加' : '扣除'} ${Math.abs(adjustAmount)} 积分！`,
      })
      // update local user state
      setUsers(prev => prev.map(u => u.id === adjustTargetUser.id ? { ...u, points: res.balance_after } : u))
      setAdjustTargetUser(null)
      // refresh stats
      authApi.adminGetStats(adminKey).then(setStats).catch(() => {})
    } catch (e: any) {
      Toast.notify({ type: 'error', message: e?.message || '调整失败' })
    } finally {
      setIsSubmittingAdjust(false)
    }
  }

  // Handle Status Toggle
  const handleToggleStatus = async (user: RPGUser) => {
    if (!adminKey) return
    const nextStatus = user.status === 'active' ? 'banned' : 'active'
    const confirmText = nextStatus === 'banned'
      ? `确定要抹杀/封禁轮回者【${user.username}】吗？封禁后将无法开启任何位面推演。`
      : `确定要恢复轮回者【${user.username}】的法则契约吗？`

    if (!window.confirm(confirmText)) return

    try {
      await authApi.adminUpdateStatus(adminKey, user.id, nextStatus)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u))
      Toast.notify({
        type: 'success',
        message: `轮回者【${user.username}】状态已更新为：${nextStatus === 'active' ? '正常' : '封禁'}`,
      })
    } catch (e: any) {
      Toast.notify({ type: 'error', message: e?.message || '更新失败' })
    }
  }

  // View User Logs
  const handleOpenLogs = async (target: RPGUser) => {
    if (!adminKey) return
    setLogsTargetUser(target)
    setLoadingLogs(true)
    try {
      const logs = await authApi.adminGetUserLogs(adminKey, target.id, 1, 50)
      setUserLogs(logs)
    } catch {
      setUserLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0e1116] flex items-center justify-center text-[#70D8E0]">
        <div className="w-8 h-8 border-2 border-[#70D8E0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // --- Login Screen ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0e1116] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16191f] border border-[#70D8E0]/40 rounded-2xl shadow-[0_0_40px_rgba(112,216,224,0.15)] p-8 text-[#E6ECE8]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-[#25292f] border border-[#70D8E0]/40 shadow-[0_0_15px_rgba(112,216,224,0.25)]">
              <ShieldCheckIcon className="w-7 h-7 text-[#70D8E0]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#E6ECE8] tracking-wider">主神空间管理中枢</h1>
              <p className="text-xs text-[#849396] mt-0.5">God Space Central Command Terminal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#849396] mb-2 uppercase tracking-wider">
                管理员权限秘钥 (Admin Secret Key)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#849396]">
                  <KeyIcon className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="请输入主神空间管理员秘钥"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] focus:ring-1 focus:ring-[#70D8E0] rounded-xl text-xs text-[#E6ECE8] outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#70D8E0] to-[#51a7af] hover:from-[#84e2e9] hover:to-[#5eb9c2] text-[#121418] font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(112,216,224,0.35)] disabled:opacity-50"
            >
              {loading ? '正在验证身份法则...' : '接入中枢终端'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#262c35] text-center">
            <a
              href="/"
              className="inline-flex items-center text-xs text-[#849396] hover:text-[#70D8E0] transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5 mr-1.5" />
              返回主神空间推演台
            </a>
          </div>
        </div>
      </div>
    )
  }

  // --- Admin Dashboard Screen ---
  return (
    <div className="min-h-screen bg-[#0e1116] text-[#E6ECE8] flex flex-col">
      {/* Top Navigation */}
      <header className="h-14 bg-[#14171d] border-b border-[#2c323b] px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#25292f] border border-[#70D8E0]/30 text-[#70D8E0]">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wide text-[#E6ECE8] flex items-center gap-2">
              主神空间中枢控制台
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#70D8E0]/15 text-[#70D8E0] border border-[#70D8E0]/30 font-mono">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] text-[#849396]">轮回者用户管理与积分宏观调配中心</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#20252e] hover:bg-[#2c333e] text-xs text-[#a5b4bc] hover:text-[#70D8E0] transition-colors border border-[#343d4b]"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>返回推演</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-500/40 text-xs transition-colors"
          >
            退出中枢
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#16191f] border border-[#2c323b] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#849396] font-medium">总注册轮回者</div>
                <div className="text-2xl font-black text-[#E6ECE8] mt-1 tracking-tight">
                  {(stats?.total_users || 0).toLocaleString()}
                  <span className="text-xs font-normal text-[#849396] ml-1">人</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-[#70D8E0] border border-[#70D8E0]/20">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#16191f] border border-[#2c323b] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#849396] font-medium">全服流通轮回积分</div>
                <div className="text-2xl font-black text-[#70D8E0] mt-1 tracking-tight">
                  {(stats?.total_points || 0).toLocaleString()}
                  <span className="text-xs font-normal text-[#849396] ml-1">Pts</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BoltIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#16191f] border border-[#2c323b] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#849396] font-medium">全服累计消耗 Token</div>
                <div className="text-2xl font-black text-purple-400 mt-1 tracking-tight">
                  {(stats?.total_tokens || 0).toLocaleString()}
                  <span className="text-xs font-normal text-[#849396] ml-1">Token</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CpuChipIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-[#16191f] border border-[#2c323b] rounded-2xl shadow-lg p-5 sm:p-6 space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#E6ECE8] flex items-center gap-2">
                轮回者列表
                <span className="text-xs font-normal text-[#849396]">
                  (共 {totalUsers} 人)
                </span>
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#849396]">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索代号..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] rounded-xl text-xs text-[#E6ECE8] outline-none"
                />
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                title="刷新列表"
                className="p-2 rounded-xl bg-[#20252e] hover:bg-[#2c333e] text-[#a5b4bc] hover:text-[#70D8E0] transition-colors border border-[#343d4b]"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#262c35] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121418] text-[#849396] uppercase tracking-wider font-semibold border-b border-[#262c35]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">轮回者代号</th>
                  <th className="py-3 px-4">轮回积分 (Pts)</th>
                  <th className="py-3 px-4">累计推演 Token</th>
                  <th className="py-3 px-4">契约状态</th>
                  <th className="py-3 px-4">入界时间</th>
                  <th className="py-3 px-4 text-right">权限操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262c35]">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#849396]">
                      <div className="w-5 h-5 border-2 border-[#70D8E0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      正在扫描空间位面档案...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#849396]">
                      暂无匹配的轮回者
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isBanned = u.status === 'banned'
                    return (
                      <tr key={u.id} className="hover:bg-[#1a1e26] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#849396]">#{u.id}</td>
                        <td className="py-3 px-4 font-bold text-[#E6ECE8] flex items-center space-x-1.5">
                          <span>{u.username}</span>
                          {u.is_admin && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              空间管理员
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#70D8E0]">
                          {u.points.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#a5b4bc]">
                          {u.total_tokens_consumed.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isBanned
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isBanned ? '已抹杀/封禁' : '法则正常'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#849396] font-mono text-[11px]">
                          {formatTime(u.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Adjust Points Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(u)}
                              className="px-2.5 py-1 rounded-lg bg-[#252a33] hover:bg-[#323945] text-[#70D8E0] border border-[#70D8E0]/30 hover:border-[#70D8E0] transition-colors font-semibold"
                            >
                              调配积分
                            </button>

                            {/* View Logs Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenLogs(u)}
                              title="查看积分明细"
                              className="p-1 rounded-lg bg-[#252a33] hover:bg-[#323945] text-[#849396] hover:text-[#E6ECE8] transition-colors"
                            >
                              <ClipboardDocumentListIcon className="w-4 h-4" />
                            </button>

                            {/* Toggle Ban Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              title={isBanned ? '解除封禁' : '抹杀/封禁'}
                              className={`p-1 rounded-lg transition-colors ${
                                isBanned
                                  ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                                  : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/60'
                              }`}
                            >
                              {isBanned ? (
                                <CheckCircleIcon className="w-4 h-4" />
                              ) : (
                                <NoSymbolIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Adjust Points Modal */}
      {adjustTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md bg-[#16191f] border border-[#70D8E0]/40 rounded-2xl shadow-[0_0_35px_rgba(112,216,224,0.18)] p-6 text-[#E6ECE8]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAdjustTargetUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#849396] hover:text-[#70D8E0] hover:bg-[#25292f] transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 rounded-xl bg-[#25292f] border border-[#70D8E0]/30 text-[#70D8E0]">
                <BoltIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E6ECE8]">调配轮回积分</h3>
                <p className="text-xs text-[#849396] mt-0.5">
                  目标：<span className="text-[#70D8E0] font-semibold">{adjustTargetUser.username}</span> (ID: #{adjustTargetUser.id})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              {/* Current Points Info */}
              <div className="p-3 rounded-xl bg-[#121418] border border-[#2c323b] flex items-center justify-between text-xs">
                <span className="text-[#849396]">当前结余积分:</span>
                <span className="font-mono font-bold text-[#70D8E0] text-sm">
                  {adjustTargetUser.points.toLocaleString()} Pts
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div>
                <label className="block text-xs font-medium text-[#849396] mb-2">
                  快捷选择变动额:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt)}
                      className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                        adjustAmount === amt
                          ? 'bg-[#70D8E0]/20 border-[#70D8E0] text-[#70D8E0]'
                          : 'bg-[#20252e] border-[#323945] text-[#a5b4bc] hover:border-[#70D8E0]/50'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[10000, 20000, -500, -1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt)}
                      className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                        adjustAmount === amt
                          ? 'bg-[#70D8E0]/20 border-[#70D8E0] text-[#70D8E0]'
                          : 'bg-[#20252e] border-[#323945] text-[#a5b4bc] hover:border-[#70D8E0]/50'
                      }`}
                    >
                      {amt > 0 ? `+${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Amount Input */}
              <div>
                <label className="block text-xs font-medium text-[#849396] mb-1.5">
                  自定义积分增减 (正数为增加，负数为扣除):
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] rounded-xl text-xs font-mono text-[#E6ECE8] outline-none"
                />
              </div>

              {/* Remark */}
              <div>
                <label className="block text-xs font-medium text-[#849396] mb-1.5">
                  调配备注 / 事由:
                </label>
                <input
                  type="text"
                  value={adjustRemark}
                  onChange={(e) => setAdjustRemark(e.target.value)}
                  placeholder="例如：主神空间特批物资、充值100元、活动奖励..."
                  className="w-full px-3 py-2 bg-[#121418] border border-[#2c323b] focus:border-[#70D8E0] rounded-xl text-xs text-[#E6ECE8] outline-none"
                />
              </div>

              {/* Balance Preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>调整后预计结余:</span>
                <span className="font-mono font-bold text-sm text-amber-200">
                  {Math.max(0, adjustTargetUser.points + adjustAmount).toLocaleString()} Pts
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#70D8E0] to-[#51a7af] hover:from-[#84e2e9] hover:to-[#5eb9c2] text-[#121418] font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                >
                  {isSubmittingAdjust ? '法则调配中...' : '确认执行调配'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Logs Modal */}
      {logsTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-lg bg-[#16191f] border border-[#70D8E0]/40 rounded-2xl shadow-2xl p-6 text-[#E6ECE8] flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLogsTargetUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#849396] hover:text-[#70D8E0] hover:bg-[#25292f] transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#25292f] border border-[#70D8E0]/30 text-[#70D8E0]">
                <ClipboardDocumentListIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E6ECE8]">积分流水历史档案</h3>
                <p className="text-xs text-[#849396] mt-0.5">
                  轮回者：<span className="text-[#70D8E0] font-semibold">{logsTargetUser.username}</span> | 当前积分: {logsTargetUser.points.toLocaleString()} Pts
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-[#849396]">
                  <div className="w-5 h-5 border-2 border-[#70D8E0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  加载流水中...
                </div>
              ) : userLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#849396]">
                  该轮回者暂无积分变动记录
                </div>
              ) : (
                userLogs.map((l) => {
                  const isPositive = l.points_change > 0
                  return (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl bg-[#121418] border border-[#262c35] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-[#E6ECE8] flex items-center gap-1.5">
                          <span>{l.remark || (isPositive ? '获得积分' : '推演消耗')}</span>
                          {l.tokens_consumed > 0 && (
                            <span className="text-[10px] text-[#849396] font-mono">
                              ({l.tokens_consumed} Token)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#5c6872] flex items-center mt-0.5">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatTime(l.created_at)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${l.points_change}` : l.points_change}
                        </div>
                        <div className="text-[10px] text-[#849396] font-mono mt-0.5">
                          余 {l.balance_after}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

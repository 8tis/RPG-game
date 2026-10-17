'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import type { PointsLog } from '@/service/auth'
import { authApi } from '@/service/auth'
import { XMarkIcon, BoltIcon, ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export const PointsLogModal: React.FC = () => {
  const { user, isPointsLogModalOpen, closePointsLogModal } = useAuth()
  const [logs, setLogs] = useState<PointsLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isPointsLogModalOpen) {
      setLoading(true)
      authApi.getUserLogs(1, 50)
        .then((data) => setLogs(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isPointsLogModalOpen])

  if (!isPointsLogModalOpen) return null

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#16191f] border border-[#70D8E0]/40 rounded-2xl shadow-[0_0_35px_rgba(112,216,224,0.18)] p-6 text-[#E6ECE8] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closePointsLogModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#849396] hover:text-[#70D8E0] hover:bg-[#25292f] transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#25292f] border border-[#70D8E0]/30 shadow-[0_0_12px_rgba(112,216,224,0.2)]">
            <BoltIcon className="w-6 h-6 text-[#70D8E0]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E6ECE8] tracking-wider">
              轮回积分财务日志
            </h2>
            <p className="text-xs text-[#849396] mt-0.5">
              代号：<span className="text-[#70D8E0] font-semibold">{user?.username}</span> | 累计消耗：{(user?.total_tokens_consumed || 0).toLocaleString()} Token
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#20252e] to-[#1a1e24] border border-[#363e4b] mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#849396]">当前可用轮回积分</div>
            <div className="text-2xl font-black text-[#70D8E0] tracking-tight mt-0.5 flex items-baseline gap-1">
              {user?.points.toLocaleString()}
              <span className="text-xs font-normal text-[#849396]">Pts</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#849396]">兑换比例</div>
            <div className="text-xs font-mono text-[#a5b4bc] mt-0.5">1000 Token = 1 Pts</div>
          </div>
        </div>

        {/* List Title */}
        <div className="text-xs font-bold text-[#849396] uppercase tracking-wider mb-2 flex items-center justify-between px-1">
          <span>最近变动记录</span>
          <span>变动后结余</span>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#849396]">
              <div className="w-5 h-5 border-2 border-[#70D8E0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              正在同步时空记录...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#849396]">
              暂无积分流转记录
            </div>
          ) : (
            logs.map((item) => {
              const isPositive = item.points_change > 0
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#121418] border border-[#262c35] hover:border-[#3a4453] transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-[#E6ECE8] flex items-center gap-1.5">
                        <span>{item.remark || (isPositive ? '获得积分' : '推演消耗')}</span>
                        {item.tokens_consumed > 0 && (
                          <span className="text-[10px] text-[#849396] font-mono">
                            ({item.tokens_consumed} Token)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#5c6872] flex items-center mt-0.5">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {formatTime(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${item.points_change}` : item.points_change}
                    </div>
                    <div className="text-[10px] text-[#849396] font-mono mt-0.5">
                      余 {item.balance_after}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#2c323b] text-center text-[11px] text-[#849396]">
          若积分不足，请联系管理员在空间中枢进行物资配发
        </div>
      </div>
    </div>
  )
}
export default PointsLogModal

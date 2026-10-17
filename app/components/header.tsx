'use client'

import type { FC } from 'react'
import React, { useState, useRef, useEffect } from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
import { useAuth } from '@/context/auth-context'

export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  const { user, isLoggedIn, openAuthModal, openPointsLogModal, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-[#1a1d22] border-b border-[#2c323b] text-[#E6ECE8] relative z-20">
      {/* Left side: Mobile menu toggle or spacer */}
      <div className="flex items-center space-x-2">
        {isMobile && (
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#25292f] cursor-pointer transition-colors"
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-[#849396] hover:text-[#70D8E0]" />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <AppIcon size="small" />
          <div className="text-xs sm:text-sm text-[#E6ECE8] font-bold tracking-wide truncate max-w-[140px] sm:max-w-[220px]">
            {title}
          </div>
        </div>
      </div>

      {/* Right side: Auth & Points & Mobile new chat */}
      <div className="flex items-center space-x-2">
        {isLoggedIn && user ? (
          <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
            {/* Points Badge */}
            <button
              type="button"
              onClick={openPointsLogModal}
              title="点击查看积分流转记录"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#20252e] to-[#1a1e24] border border-[#70D8E0]/40 hover:border-[#70D8E0] text-[#70D8E0] shadow-[0_0_10px_rgba(112,216,224,0.15)] transition-all cursor-pointer group"
            >
              <BoltIcon className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-xs font-mono font-bold tracking-tight">
                {user.points.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#849396] font-normal hidden xs:inline">Pts</span>
            </button>

            {/* User Chip */}
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#25292f] hover:bg-[#2c323b] border border-[#363e4b] hover:border-[#70D8E0]/50 transition-colors"
            >
              <UserCircleIcon className="w-4 h-4 text-[#70D8E0]" />
              <span className="text-xs font-medium text-[#E6ECE8] max-w-[80px] sm:max-w-[100px] truncate">
                {user.username}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#16191f] border border-[#2c323b] rounded-xl shadow-2xl p-2 text-xs text-[#E6ECE8] animate-fade-in z-50">
                <div className="px-2.5 py-2 border-b border-[#262b33] mb-1">
                  <div className="font-bold text-[#E6ECE8] truncate">{user.username}</div>
                  <div className="text-[11px] text-[#849396] mt-0.5">
                    累计推演: <span className="font-mono text-[#a5b4bc]">{user.total_tokens_consumed.toLocaleString()}</span> Token
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false)
                    openPointsLogModal()
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-[#25292f] text-[#a5b4bc] hover:text-[#70D8E0] transition-colors text-left"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#70D8E0]" />
                  <span>轮回积分明细</span>
                </button>

                <a
                  href="/admin"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-[#25292f] text-[#a5b4bc] hover:text-[#70D8E0] transition-colors text-left"
                >
                  <Cog6ToothIcon className="w-4 h-4 text-[#849396]" />
                  <span>主神空间管理中枢</span>
                </a>

                <div className="my-1 border-t border-[#262b33]" />

                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false)
                    logout()
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 transition-colors text-left"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>断开神经连接</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#70D8E0] to-[#51a7af] hover:from-[#84e2e9] hover:to-[#5eb9c2] text-[#121418] font-bold text-xs shadow-[0_0_12px_rgba(112,216,224,0.3)] transition-all cursor-pointer"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#121418]" />
            <span>登入 / 建立契约</span>
          </button>
        )}

        {/* Mobile new chat button */}
        {isMobile && (
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#25292f] cursor-pointer transition-colors"
            onClick={() => onCreateNewChat?.()}
          >
            <PencilSquareIcon className="h-4 w-4 text-[#849396] hover:text-[#70D8E0]" />
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(Header)

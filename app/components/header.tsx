import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
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
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-[#1a1d22] border-b border-[#2c323b] text-[#E6ECE8]">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#25292f] cursor-pointer transition-colors'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-[#849396] hover:text-[#70D8E0]" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className="text-sm text-[#E6ECE8] font-bold tracking-wide">{title}</div>
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#25292f] cursor-pointer transition-colors' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-[#849396] hover:text-[#70D8E0]" />
          </div>)
        : <div></div>}
    </div>
  )
}

export default React.memo(Header)

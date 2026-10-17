import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

const MAX_CONVERSATION_LENTH = 20

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
}) => {
  const { t } = useTranslation()
  return (
    <div
      className="shrink-0 flex flex-col overflow-y-auto bg-[#16191f] pc:w-[244px] tablet:w-[192px] mobile:w-[240px] border-r border-[#2c323b] tablet:h-[calc(100vh_-_3rem)] mobile:h-screen text-[#E6ECE8]"
    >
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 p-4 !pb-0">
          <button
            type="button"
            onClick={() => { onCurrentIdChange('-1') }}
            className="group flex w-full justify-start items-center h-9 px-3 rounded-xl bg-[#25292f] hover:bg-[#2c323b] text-[#70D8E0] border border-[#363d47] hover:border-[#70D8E0]/60 font-bold text-xs tracking-wide shadow-sm transition-all"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4 text-[#70D8E0]" /> {t('app.chat.newChat')}
          </button>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-1 bg-[#16191f] p-4 !pt-0">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-[#25292f] text-[#70D8E0] border border-[#70D8E0]/40 font-bold shadow-xs'
                  : 'text-[#849396] hover:bg-[#1a1d22] hover:text-[#E6ECE8] border border-transparent',
                'group flex items-center rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-all',
              )}
            >
              <ItemIcon
                className={classNames(
                  isCurrent
                    ? 'text-[#70D8E0]'
                    : 'text-[#849396] group-hover:text-[#E6ECE8]',
                  'mr-2.5 h-4 w-4 flex-shrink-0',
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </div>
          )
        })}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 pr-4 pb-4 pl-4">
        <div className="text-[#849396] font-normal text-xs">© {copyRight} {(new Date()).getFullYear()}</div>
      </div>
    </div>
  )
}

export default React.memo(Sidebar)

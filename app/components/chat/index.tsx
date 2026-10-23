'use client'

import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import WorldAccessModal from './world-access-modal'
import Toast from '@/app/components/base/toast'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { useGameHudState, type CompanionInfo } from '@/hooks/use-game-hud-state'
import { GameHudSidebar } from './game-hud-sidebar'
import { ActionControls } from './action-controls'
import { BackpackModal } from './modals/backpack-modal'
import { ShopModal } from './modals/shop-modal'
import { CompanionModal } from './modals/companion-modal'
import QuickCommandsBar from './quick-commands'

export interface IChatProps {
  chatList: ChatItem[]
  isNewConversation?: boolean
  isLoadingConversation?: boolean
  feedbackDisabled?: boolean
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[], customInputs?: Record<string, any>) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
}

const Chat: FC<IChatProps> = ({
  chatList,
  isNewConversation = true,
  isLoadingConversation = false,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding = false,
  controlClearQuery,
  visionConfig,
  fileConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast

  // 游戏核心状态解析器（实时单向数据流与单一大脑数据源）
  const hudState = useGameHudState(chatList, isResponding)

  // 模态框与抽屉状态管理
  const [showBackpackModal, setShowBackpackModal] = useState(false)
  const [showShopModal, setShowShopModal] = useState(false)
  const [showCompanionModal, setShowCompanionModal] = useState(false)
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionInfo | null>(null)
  const [showMobileHudDrawer, setShowMobileHudDrawer] = useState(false)
  const [showQuickCommands, setShowQuickCommands] = useState(false)

  const handleOpenCompanion = (companion?: CompanionInfo) => {
    if (companion) {
      setSelectedCompanion(companion)
    } else if (!selectedCompanion && hudState.companions.length > 0) {
      setSelectedCompanion(hudState.companions[0])
    }
    setShowCompanionModal(true)
  }

  const gameLogContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 判断游戏是否已经正式启动（通过判断对话列表是否有用户发送的降临指令或正常提问）
  const hasGameStarted = chatList.some(item => !item.isOpeningStatement && !item.isAnswer)

  // 当产生新对话或流式输出时平滑滚动到底部
  useEffect(() => {
    if (chatEndRef.current && gameLogContainerRef.current) {
      gameLogContainerRef.current.scrollTop = gameLogContainerRef.current.scrollHeight
    }
  }, [chatList, isResponding])

  // 处理全局快捷指令事件派发
  useEffect(() => {
    const handleInsertEvent = (e: any) => {
      if (e.detail) {
        onSend(e.detail, [])
      }
    }
    window.addEventListener('insert-command', handleInsertEvent)
    return () => {
      window.removeEventListener('insert-command', handleInsertEvent)
    }
  }, [onSend])

  // 如果正在加载历史对话，显示沉浸式主神空间科幻加载状态
  if (isLoadingConversation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-[#849396]">
        <div className="relative mb-5">
          <div className="w-12 h-12 rounded-xl border border-[#70D8E0]/40 flex items-center justify-center animate-spin">
            <div className="w-6 h-6 border-2 border-t-[#70D8E0] border-r-transparent border-b-[#88CBAA] border-l-transparent rounded-full" />
          </div>
        </div>
        <div className="text-sm font-semibold tracking-wider text-[#70D8E0] animate-pulse">
          【主神空间】正在同步宿主轮回世界线档案...
        </div>
        <div className="text-xs text-[#849396] mt-2 tracking-wide">
          神经链接接入中，正在提取记忆矩阵与位面状态
        </div>
      </div>
    )
  }

  // 只有当这是一个全新的对话且游戏尚未开始时，展现降临身份录入视窗
  if (isNewConversation && !hasGameStarted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start py-2 px-2 sm:px-4">
        <WorldAccessModal
          isOpen={true}
          isInline={true}
          onClose={() => {}}
          onLaunch={(msg, inputs) => onSend(msg, [], inputs)}
        />
      </div>
    )
  }

  // 核心游戏沉浸交互视窗（1:1 完美复刻参考项目的 HUD 侧边栏 + 叙事日志主屏 + 行动决策胶囊系统）
  return (
    <div className="flex w-full h-full gap-3 sm:gap-4 overflow-hidden relative">
      {/* 1. 左侧：桌面端常驻 HUD 侧边栏 (#desktop-hud-sidebar) */}
      <GameHudSidebar
        state={hudState}
        onOpenShop={() => setShowShopModal(true)}
        onOpenBackpack={() => setShowBackpackModal(true)}
        onOpenCompanion={handleOpenCompanion}
        onOpenLog={() => {}}
      />

      {/* 移动端全屏滑出 HUD 抽屉 */}
      {showMobileHudDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden flex animate-fade-in"
          onClick={() => setShowMobileHudDrawer(false)}
        >
          <div onClick={e => e.stopPropagation()} className="h-full">
            <GameHudSidebar
              state={hudState}
              onOpenShop={() => {
                setShowMobileHudDrawer(false)
                setShowShopModal(true)
              }}
              onOpenBackpack={() => {
                setShowMobileHudDrawer(false)
                setShowBackpackModal(true)
              }}
              onOpenCompanion={(comp) => {
                setShowMobileHudDrawer(false)
                handleOpenCompanion(comp)
              }}
              onOpenLog={() => {}}
              isMobileDrawer={true}
              onCloseDrawer={() => setShowMobileHudDrawer(false)}
            />
          </div>
        </div>
      )}

      {/* 2. 右侧：主剧情叙事视窗 (#narrative-pane) */}
      <div
        className="flex-1 flex flex-col overflow-hidden h-full frosted-theme-card rounded-2xl p-3 sm:p-4 min-w-0 bg-[#161a22]/85 backdrop-blur-md border border-white/10 shadow-2xl relative"
        id="narrative-pane"
      >
        {/* 顶部标题与行动快捷栏 (Top Header Bar) */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5 shrink-0">
              <span className="text-base sm:text-lg">⚔️</span>
              <span>诸天轮回日志</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 font-mono truncate max-w-[120px] sm:max-w-[260px]">
              {hudState.world}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 移动端角色状态 HUD 呼出按钮 */}
            <button
              onClick={() => setShowMobileHudDrawer(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[#70D8E0] text-xs font-bold border border-white/10 cursor-pointer shadow-sm active:scale-95"
              id="show-hud-btn"
              title="查看角色状态"
              type="button"
            >
              <span>👤</span>
              <span className="hidden xs:inline">角色状态</span>
            </button>

            {/* 随身行囊按钮 */}
            <button
              onClick={() => setShowBackpackModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer shadow-sm active:scale-95"
              title="整理随身背包"
              type="button"
            >
              <span>🎒</span>
              <span className="hidden sm:inline">行囊</span>
            </button>

            {/* 主神商城按钮 */}
            <button
              onClick={() => setShowShopModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-600/10 hover:bg-yellow-600/30 text-yellow-300 text-xs font-bold border border-yellow-600/30 cursor-pointer shadow-sm active:scale-95"
              title="位面兑换商城"
              type="button"
            >
              <span>🏪</span>
              <span className="hidden sm:inline">商城</span>
            </button>

            {/* 快捷指令折叠按钮 */}
            <button
              onClick={() => setShowQuickCommands(!showQuickCommands)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-sm active:scale-95 ${
                showQuickCommands
                  ? 'bg-purple-600/30 text-purple-200 border-purple-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
              }`}
              title="系统辅助指令工具栏"
              type="button"
            >
              <span>⚡</span>
              <span className="hidden md:inline">辅助指令</span>
            </button>
          </div>
        </div>

        {/* 可选展开的系统辅助指令栏 */}
        {showQuickCommands && (
          <div className="mb-2 p-2 rounded-xl bg-black/40 border border-white/10 flex-shrink-0 animate-fade-in">
            <QuickCommandsBar onInsertCommand={(cmd) => onSend(cmd, [])} />
          </div>
        )}

        {/* 中间核心：沉浸剧情叙事正文流 (#game-log-container & #game-log-body) */}
        <div
          ref={gameLogContainerRef}
          className="flex-grow overflow-y-auto pr-2 mb-1 custom-scrollbar"
          id="game-log-container"
        >
          <div className="text-sm sm:text-base leading-relaxed space-y-4 max-w-3xl w-full mx-auto" id="game-log-body">
            {chatList
              .filter(item => !item.isOpeningStatement || (item.content && !item.content.includes('在上方视窗完成身份录入')))
              .map((item) => {
                if (item.isAnswer) {
                  const isLast = item.id === chatList[chatList.length - 1].id
                  return (
                    <Answer
                      key={item.id}
                      item={item}
                      feedbackDisabled={feedbackDisabled}
                      onFeedback={onFeedback}
                      isResponding={isResponding && isLast}
                      suggestionClick={(s) => onSend(s, [])}
                    />
                  )
                }
                return (
                  <Question
                    key={item.id}
                    id={item.id}
                    content={item.content}
                    useCurrentUserAvatar={useCurrentUserAvatar}
                    imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(i => i.url) : []}
                  />
                )
              })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 底部行动控制区 (#action-controls: Choices + Survival Capsule Bar + Expandable Input) */}
        {!isHideSendInput && (
          <ActionControls
            choices={hudState.latestChoices}
            currency={hudState.currency}
            currencyName={hudState.currencyName}
            activeCompanion={selectedCompanion || hudState.activeCompanion || (hudState.companions[0] || null)}
            onSend={(msg, files) => onSend(msg, files || [])}
            onOpenShop={() => setShowShopModal(true)}
            onOpenBackpack={() => setShowBackpackModal(true)}
            onOpenCompanion={() => handleOpenCompanion()}
            isResponding={isResponding}
            visionConfig={visionConfig}
            fileConfig={fileConfig}
          />
        )}
      </div>

      {/* 随身背包模态框 */}
      <BackpackModal
        isOpen={showBackpackModal}
        onClose={() => setShowBackpackModal(false)}
        inventory={hudState.inventory}
        equipment={hudState.equipment}
        currency={hudState.currency}
        currencyName={hudState.currencyName}
        onAction={(action) => onSend(action, [])}
      />

      {/* 主神商城兑换模态框 */}
      <ShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        currency={hudState.currency}
        currencyName={hudState.currencyName}
        onAction={(action) => onSend(action, [])}
      />

      {/* 伙伴机密档案与互动模态框 (支持多同伴切换) */}
      <CompanionModal
        isOpen={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
        companion={selectedCompanion || hudState.activeCompanion || (hudState.companions[0] || null)}
        companions={hudState.companions}
        onSelectCompanion={(comp) => setSelectedCompanion(comp)}
        onAction={(action) => onSend(action, [])}
      />
    </div>
  )
}

export default React.memo(Chat)

'use client'

import React, { useState, useRef } from 'react'
import type { ChoiceOption, CompanionInfo } from '@/hooks/use-game-hud-state'
import type { VisionFile, VisionSettings } from '@/types/app'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import { TransferMethod } from '@/types/app'

interface ActionControlsProps {
  choices: ChoiceOption[]
  currency: number
  currencyName: string
  activeCompanion: CompanionInfo | null
  onSend: (message: string, files?: VisionFile[]) => void
  onOpenShop: () => void
  onOpenBackpack: () => void
  onOpenCompanion: () => void
  isResponding?: boolean
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  choices,
  currency,
  currencyName,
  activeCompanion,
  onSend,
  onOpenShop,
  onOpenBackpack,
  onOpenCompanion,
  isResponding = false,
  visionConfig,
  fileConfig,
}) => {
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = useState<FileEntity[]>([])

  const handleChoiceClick = (choice: ChoiceOption) => {
    if (isResponding) return
    onSend(choice.actionText)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isResponding) return

    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]

    onSend(query.trim(), combinedFiles)
    setQuery('')
    if (files.length) onClear()
    setAttachmentFiles([])
  }

  const handleQuickAction = (text: string) => {
    if (isResponding) return
    onSend(text)
  }

  return (
    <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0" id="action-controls">
      {/* Upper Layer: Dynamic Story Choices Grid or Calculating State */}
      {isResponding ? (
        <div className="w-full p-2.5 rounded-xl bg-slate-900/50 border border-[#70D8E0]/30 flex items-center justify-center gap-2.5 text-xs text-[#70D8E0] mb-2 animate-pulse select-none shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70D8E0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70D8E0]"></span>
          </span>
          <span>主神空间正在演变世界因果与行动决策分支...</span>
        </div>
      ) : (
        choices && choices.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-h-[26vh] overflow-y-auto pr-1 mb-2 custom-scrollbar"
            id="choices-container"
          >
            {choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoiceClick(choice)}
                disabled={isResponding}
                type="button"
                className="group p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 active:scale-[0.98] border border-white/10 hover:border-[#70D8E0]/60 transition-all duration-200 text-left flex items-start gap-2 cursor-pointer shadow-md text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-[#70D8E0] text-xs mt-0.5 shrink-0 opacity-70 group-hover:opacity-100">✦</span>
                <span className="text-[#E6ECE8] group-hover:text-white font-medium leading-relaxed flex-1">
                  {choice.label}
                </span>
              </button>
            ))}
          </div>
        )
      )}

      {/* Lower Layer: Survival Action Capsule Bar */}
      <div
        className="w-full p-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between gap-2 flex-wrap text-xs select-none transition-all duration-300"
        id="survival-capsule-bar"
      >
        {/* Left: Core Action Capsule Buttons (去除了露营、整理行囊、搜刮四周) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onOpenShop}
            disabled={isResponding}
            className="px-2.5 py-1.5 rounded-lg font-bold bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 active:scale-95 transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
            id="capsule-btn-shop"
            title="打开主神位面兑换商城"
            type="button"
          >
            <span>🏪</span>
            <span>主神兑换</span>
          </button>

          {activeCompanion && (
            <button
              onClick={onOpenCompanion}
              className="px-2.5 py-1.5 rounded-lg font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 active:scale-95 transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-sm"
              id="capsule-btn-companion"
              title="与随行伙伴对话、互动或分享食物"
              type="button"
            >
              <span>💬</span>
              <span>伙伴互动</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsCustomInputOpen(!isCustomInputOpen)
              setTimeout(() => inputRef.current?.focus(), 100)
            }}
            className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-sm ${
              isCustomInputOpen
                ? 'bg-purple-600/40 text-purple-200 border-purple-400'
                : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 hover:text-purple-200 border-purple-500/30'
            }`}
            id="capsule-btn-custom"
            title="输入自定义冒险动作"
            type="button"
          >
            <span>⌨️</span>
            <span>自由输入</span>
          </button>
        </div>

        {/* Right: Companion Status Pill & Currency Tracker */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeCompanion && (
            <div
              onClick={onOpenCompanion}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold cursor-pointer hover:bg-indigo-900/60 transition-all shadow-sm"
              id="companion-hud-pill"
              title="点击查看伙伴详细资料与特技"
            >
              <span className="text-sm">{activeCompanion.avatar || '👥'}</span>
              <span>{activeCompanion.name}</span>
              <span className="text-rose-400 font-mono text-[11px] flex items-center gap-0.5">
                ❤️ {activeCompanion.affinity}
              </span>
            </div>
          )}

          <div
            className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10"
            id="wood-capsule-display"
            title={`当前持有${currencyName}`}
          >
            🪙
            <span className="text-yellow-400 font-bold">
              {currency.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Inline Custom Action Form */}
      {isCustomInputOpen && (
        <form
          onSubmit={handleCustomSubmit}
          className="mt-2 pt-2 border-t border-white/10 transition-all duration-200"
          id="custom-action-form"
        >
          {visionConfig?.enabled && (
            <div className="mb-2">
              <ChatImageUploader
                settings={visionConfig}
                onUpload={onUpload}
                disabled={files.length >= visionConfig.number_limits}
              />
              <ImageList
                list={files}
                onRemove={onRemove}
                onReUpload={onReUpload}
                onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                onImageLinkLoadError={onImageLinkLoadError}
              />
            </div>
          )}

          {fileConfig?.enabled && (
            <div className="mb-2">
              <FileUploaderInAttachmentWrapper
                fileConfig={fileConfig}
                value={attachmentFiles}
                onChange={setAttachmentFiles}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入你想执行的任意冒险动作（如：在夕阳下观察废墟全貌、拔出高斯手枪瞄准阴影）..."
              disabled={isResponding}
              className="frosted-theme-input text-white text-xs sm:text-sm rounded-lg focus:ring-1 focus:ring-[#70D8E0] focus:border-transparent block w-full p-2 sm:p-2.5 border border-white/10 bg-slate-950/70 outline-none"
              id="custom-action-input"
            />
            <button
              type="submit"
              disabled={!query.trim() || isResponding}
              className="bg-gradient-to-r from-[#70D8E0] to-[#88CBAA] hover:brightness-110 text-slate-950 font-bold px-3.5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 cursor-pointer border border-white/10 flex items-center justify-center min-w-[38px] min-h-[38px] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
              id="custom-action-submit-btn"
              title="发送指令"
            >
              <svg className="w-4 h-4 transform rotate-90 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsCustomInputOpen(false)}
              className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 text-xs font-bold cursor-pointer shrink-0"
              id="custom-action-close-btn"
              title="收起输入框"
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

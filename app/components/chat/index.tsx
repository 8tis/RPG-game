'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import QuickCommandsBar from './quick-commands'
import GameHud from './game-hud'
import WorldAccessModal from './world-access-modal'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
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
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const textareaRef = useRef<any>(null)

  const handleInsertCommand = (template: string) => {
    setQuery(template)
    queryRef.current = template
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus?.()
        const match = template.match(/\[(.*?)\]/)
        if (match && match.index !== undefined && textareaRef.current.setSelectionRange) {
          textareaRef.current.setSelectionRange(match.index, match.index + match[0].length)
        }
      }
    }, 50)
  }

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  useEffect(() => {
    const handleInsertEvent = (e: any) => {
      if (e.detail) {
        handleInsertCommand(e.detail)
      }
    }
    window.addEventListener('insert-command', handleInsertEvent)
    return () => {
      window.removeEventListener('insert-command', handleInsertEvent)
    }
  }, [])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  // 判断游戏是否已经正式启动（通过判断对话列表是否有用户发送的降临指令或正常提问）
  const hasGameStarted = chatList.some(item => !item.isOpeningStatement && !item.isAnswer)

  if (!hasGameStarted) {
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

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full')}>
      {/* 顶部 Game HUD 游戏状态面板 */}
      <GameHud chatList={chatList} onStartGame={(msg, inputs) => onSend(msg, [], inputs)} />

      {/* Chat List */}
      <div className="h-full space-y-[30px]">
        {chatList
          .filter(item => !item.isOpeningStatement || (item.content && !item.content.includes('在上方视窗完成身份录入')))
          .map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <div className='fixed z-20 bottom-0 left-1/2 transform -translate-x-1/2 pc:ml-[122px] tablet:ml-[96px] mobile:ml-0 pc:w-[794px] tablet:w-[794px] max-w-full mobile:w-full px-3.5 pb-3 pointer-events-none'>
            <div className='pointer-events-auto'>
              {/* 风月同款：快捷指令工具栏 */}
              <QuickCommandsBar onInsertCommand={handleInsertCommand} />

              {/* 风月同款：发光科技圆角输入框容器 */}
              <div className='relative p-[7px] max-h-[160px] bg-[#1a1d22]/95 backdrop-blur-md border border-[#343b44] hover:border-[#70D8E0]/70 focus-within:border-[#70D8E0] rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.6)] transition-all'>
                {
                  visionConfig?.enabled && (
                    <>
                      <div className='absolute bottom-2 left-2 flex items-center'>
                        <ChatImageUploader
                          settings={visionConfig}
                          onUpload={onUpload}
                          disabled={files.length >= visionConfig.number_limits}
                        />
                        <div className='mx-1 w-[1px] h-4 bg-white/10' />
                      </div>
                      <div className='pl-[52px]'>
                        <ImageList
                          list={files}
                          onRemove={onRemove}
                          onReUpload={onReUpload}
                          onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                          onImageLinkLoadError={onImageLinkLoadError}
                        />
                      </div>
                    </>
                  )
                }
                {
                  fileConfig?.enabled && (
                    <div className={`${visionConfig?.enabled ? 'pl-[52px]' : ''} mb-1`}>
                      <FileUploaderInAttachmentWrapper
                        fileConfig={fileConfig}
                        value={attachmentFiles}
                        onChange={setAttachmentFiles}
                      />
                    </div>
                  )
                }
                <Textarea
                  ref={textareaRef}
                  className={`
                    block w-full px-2 pr-[110px] py-[6px] leading-6 max-h-none text-base text-[#E6ECE8] placeholder-[#849396] outline-none appearance-none resize-none bg-transparent
                    ${visionConfig?.enabled && 'pl-12'}
                  `}
                  placeholder="输入你的游戏指令，或点击选项与快捷按钮..."
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize
                />
                <div className="absolute bottom-2.5 right-4 flex items-center h-8 gap-2">
                  <div className="text-xs font-mono font-medium text-[#849396] bg-[#25292f] border border-[#363d47] px-2 py-0.5 rounded-md">
                    {query.trim().length}
                  </div>
                  <Tooltip
                    selector='send-tip'
                    htmlContent={
                      <div>
                        <div>{t('common.operation.send')} Enter</div>
                        <div>{t('common.operation.lineBreak')} Shift Enter</div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!query.trim() || isResponding}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-95 shadow-md",
                        query.trim() && !isResponding
                          ? "bg-gradient-to-r from-[#70D8E0] via-[#88CBAA] to-[#70D8E0] hover:brightness-110 text-[#12151a] font-black shadow-[0_0_12px_rgba(112,216,224,0.4)] cursor-pointer"
                          : "bg-[#25292f] text-[#849396] cursor-not-allowed shadow-none border border-[#363d47]"
                      )}
                      title="发送指令"
                    >
                      <svg className="w-4 h-4 transform rotate-90 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)

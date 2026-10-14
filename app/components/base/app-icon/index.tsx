import type { FC } from 'react'
import classNames from 'classnames'
import style from './style.module.css'

export interface AppIconProps {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  icon?: string
  background?: string
  className?: string
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  className,
}) => {
  return (
    <span
      className={classNames(
        style.appIcon,
        size !== 'medium' && style[size],
        rounded && style.rounded,
        className ?? '',
        'overflow-hidden',
      )}
      style={{
        background,
      }}
    >
      <img src="/bot-avatar.jpg" alt="RPG Bot" className="w-full h-full object-cover" />
    </span>
  )
}

export default AppIcon

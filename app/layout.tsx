import type { Metadata } from 'next'
import { getLocaleOnServer } from '@/i18n/server'

import { Providers } from './providers'
import './styles/globals.css'
import './styles/markdown.scss'

export const metadata: Metadata = {
  title: '诸天万界模拟器 - RPG Game',
  description: 'AI 诸天万界模拟器 RPG',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="h-full">
        <div className="overflow-x-auto">
          <div className="w-screen h-screen min-w-[300px]">
            <Providers>
              {children}
            </Providers>
          </div>
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout

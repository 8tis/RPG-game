import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

export const getLocaleOnServer = async (): Promise<Locale> => {
  try {
    // @ts-expect-error locales are readonly
    const locales: string[] = i18n.locales

    let languages: string[] = []
    // get locale from cookie
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('locale')
    if (localeCookie?.value) {
      languages = [localeCookie.value]
    }

    if (!languages.length) {
      // Negotiator expects plain object so we need to transform headers
      const negotiatorHeaders: Record<string, string> = {}
      const headersList = await headers()
      headersList.forEach((value, key) => (negotiatorHeaders[key] = value))
      // Use negotiator and intl-localematcher to get best locale
      const rawLanguages = new Negotiator({ headers: negotiatorHeaders }).languages()
      // Filter out wildcard '*' which throws RangeError in intl-localematcher
      languages = (rawLanguages || []).filter(lang => lang && lang !== '*')
    }

    if (!languages.length) {
      return (i18n.defaultLocale as Locale) || 'zh-Hans'
    }

    // match locale
    const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
    return matchedLocale
  }
  catch {
    return (i18n.defaultLocale as Locale) || 'zh-Hans'
  }
}

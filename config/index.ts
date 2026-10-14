import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID || 'd3226876-84e7-4087-a4dd-9d489fa6d626'}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY || 'app-6seHwSEnRrO1hhEbZW1JDy4X'}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://43.135.167.237:8080/v1'}`
export const APP_INFO: AppInfo = {
  title: '超低消耗无限流——【无限重生系统】',
  description: '诸天无限重生模拟器，开启你的轮回攻略之旅！',
  copyright: '无限重生系统 主机总控',
  privacy_policy: '',
  default_language: 'zh-Hans',
  disable_session_same_site: false,
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48

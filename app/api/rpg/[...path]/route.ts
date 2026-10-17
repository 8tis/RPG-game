import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const RPG_BACKEND_URL = process.env.RPG_API_BACKEND_URL || 'http://47.122.116.72:8080/rpg-api'

async function handleProxy(request: NextRequest, props: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await props.params
  const path = (params.path || []).join('/')
  const search = request.nextUrl.search
  const targetUrl = `${RPG_BACKEND_URL}/api/${path}${search}`

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
  }
  const auth = request.headers.get('authorization')
  if (auth) headers['Authorization'] = auth

  const adminKey = request.headers.get('x-admin-key')
  if (adminKey) headers['X-Admin-Key'] = adminKey

  let body: any = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      body = undefined
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })
    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      code: 500,
      msg: `代理至RPG服务失败: ${error?.message || error}`,
    }, { status: 500 })
  }
}

export const GET = handleProxy
export const POST = handleProxy
export const PUT = handleProxy
export const DELETE = handleProxy

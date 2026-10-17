import type { NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

const RPG_BACKEND_URL = process.env.RPG_API_BACKEND_URL || 'http://47.122.116.72:8080/rpg-api'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
    files,
    conversation_id: conversationId,
    response_mode: responseMode,
    model: selectedModel,
  } = body

  if (selectedModel) {
    try {
      await fetch(`${RPG_BACKEND_URL}/api/models/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: selectedModel,
          conversation_id: conversationId && conversationId !== '-1' ? conversationId : undefined,
        }),
      })
    } catch {
      // Proceed even if background switch had non-critical issue
    }
  }

  const { user } = getInfo(request)
  const res = await client.createChatMessage(inputs, query, user, responseMode, conversationId, files)
  return new Response(res.data as any)
}


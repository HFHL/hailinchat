import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { model, messages } = await request.json()

    const apiKey = process.env.API_KEY
    const baseUrl = process.env.BASE_URL

    if (!apiKey || !baseUrl) {
      return new Response(JSON.stringify({ error: 'API configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to get AI response' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let isClosed = false

        const closeController = () => {
          if (!isClosed) {
            isClosed = true
            controller.close()
          }
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  closeController()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content && !isClosed) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          if (!isClosed) {
            controller.error(error)
          }
        } finally {
          reader.releaseLock()
          closeController()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
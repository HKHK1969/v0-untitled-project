import { consumeStream, convertToModelMessages, streamText, UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: "xai/grok-3-mini",
    system: `You are a helpful AI assistant for "Sourcing Ninja", an apparel supply chain management application. 
You help users with:
- Managing customers, suppliers, and styles
- Tracking sample orders and price quotes
- Understanding the supply chain workflow
- Answering questions about the application features
- Providing guidance on best practices for apparel sourcing

Be concise, helpful, and friendly. If you don't know something specific about the user's data, suggest where they might find it in the application.`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}

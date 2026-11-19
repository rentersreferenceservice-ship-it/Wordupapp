import ConversationClient from './ConversationClient'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <div className="min-h-screen bg-white">
      <ConversationClient code={code.toUpperCase()} />
    </div>
  )
}

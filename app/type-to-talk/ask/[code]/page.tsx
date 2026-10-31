import AskClient from './AskClient'

export const dynamic = 'force-dynamic'

export default async function TypeToTalkAskPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  return (
    <div className="min-h-screen bg-white">
      <AskClient code={code} />
    </div>
  )
}

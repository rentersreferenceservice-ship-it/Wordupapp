import LiveClient from './LiveClient'

export const dynamic = 'force-dynamic'

export default async function TypeToTalkLivePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  return (
    <div className="min-h-screen bg-white">
      <LiveClient code={code} />
    </div>
  )
}

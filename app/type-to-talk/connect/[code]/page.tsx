import ConnectClient from './ConnectClient'

export const dynamic = 'force-dynamic'

export default async function ConnectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <div className="min-h-screen bg-white">
      <ConnectClient code={code} />
    </div>
  )
}

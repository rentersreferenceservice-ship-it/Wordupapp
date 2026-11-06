import TabletConnectionProvider from '@/app/components/TabletConnectionProvider'
import AskFreestyleClient from './AskFreestyleClient'

export const dynamic = 'force-dynamic'

export default function AskPage() {
  return (
    <div className="min-h-screen bg-white">
      <TabletConnectionProvider>
        <AskFreestyleClient />
      </TabletConnectionProvider>
    </div>
  )
}

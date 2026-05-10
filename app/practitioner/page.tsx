import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function PractitionerIndex() {
  const { userId } = await auth()
  if (userId) redirect('/practitioner/dashboard')
  redirect('/practitioner/get-started')
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import TestimonialManager from './TestimonialManager'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function TestimonialsAdminPage() {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) redirect('/practitioner/dashboard')

  const { data: testimonials } = await getSupabase()
    .from('testimonials')
    .select('*')
    .order('approved', { ascending: true })
    .order('submitted_at', { ascending: false })

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/practitioner/dashboard" className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Family Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">
            Approve submissions to publish them on the homepage.
          </p>
        </div>
      </div>
      <TestimonialManager testimonials={testimonials ?? []} />
    </main>
  )
}

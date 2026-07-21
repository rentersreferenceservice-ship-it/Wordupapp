import { getSupabase } from '@/lib/supabase'
import PublicNav from '@/app/components/PublicNav'
import PublicFooter from '@/app/components/PublicFooter'
import ReflectionsClient from './ReflectionsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Reflections — Word Up S2C',
  description: 'Share your experience with Word Up and Spelling to Communicate.',
}

export default async function ReflectionsPage() {
  const { data: reflections } = await getSupabase()
    .from('testimonials')
    .select('id, name_display, role_description, testimonial_text, photo_url')
    .eq('approved', true)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <PublicNav />
      <ReflectionsClient reflections={reflections ?? []} />
      <PublicFooter />
    </>
  )
}

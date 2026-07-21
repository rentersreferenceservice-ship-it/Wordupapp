import { getSupabase } from '@/lib/supabase'
import PublicNav from '@/app/components/PublicNav'
import PublicFooter from '@/app/components/PublicFooter'
import ReflectionForm from './ReflectionForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Reflections — Word Up S2C',
  description: 'Voices from families and practitioners whose lives have been touched by Spelling to Communicate.',
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

      {/* Header */}
      <section className="py-20 text-center" style={{ background: '#fdf9f4' }}>
        <div className="max-w-2xl mx-auto px-8">
          <p className="text-xs uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#a08060' }}>
            Community
          </p>
          <h1 className="font-bold mb-5" style={{ color: '#2a1f17', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.2' }}>
            Reflections
          </h1>
          <p className="leading-relaxed" style={{ color: '#7a6a5a', fontSize: '1.05rem' }}>
            Words from families, practitioners, and everyone whose life has been touched by Spelling to Communicate.
          </p>
        </div>
      </section>

      {/* Approved reflections */}
      {reflections && reflections.length > 0 && (
        <section className="py-20" style={{ background: 'white' }}>
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {reflections.map((r) => (
                <div key={r.id} className="rounded-3xl p-8 flex flex-col"
                  style={{ background: '#fdf9f4', boxShadow: '0 2px 20px rgba(90,60,30,0.06)' }}>
                  <span className="text-5xl leading-none mb-4 font-serif" style={{ color: '#C9A435' }}>&ldquo;</span>
                  <p className="leading-relaxed flex-1 mb-7" style={{ color: '#5a4a3a', fontSize: '1.02rem', lineHeight: '1.75' }}>
                    {r.testimonial_text}
                  </p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #e8ddd0' }}>
                    {r.photo_url && (
                      <img src={r.photo_url} alt={r.name_display}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                        style={{ border: '2px solid #e8ddd0' }} />
                    )}
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2a1f17' }}>{r.name_display}</p>
                      {r.role_description && (
                        <p className="text-xs mt-0.5" style={{ color: '#a08060' }}>{r.role_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-8">
        <div style={{ height: '1px', background: '#e8ddd0' }} />
      </div>

      {/* Submission form */}
      <ReflectionForm />

      <PublicFooter />
    </>
  )
}

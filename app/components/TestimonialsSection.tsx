import { getSupabase } from '@/lib/supabase'

export default async function TestimonialsSection() {
  const { data: testimonials } = await getSupabase()
    .from('testimonials')
    .select('id, name_display, role_description, testimonial_text, photo_url')
    .eq('approved', true)
    .order('submitted_at', { ascending: false })
    .limit(6)

  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="py-24" style={{ background: '#fdf9f4' }}>
      <div className="max-w-5xl mx-auto px-8">
        <p className="text-xs uppercase tracking-[0.3em] mb-4 font-medium text-center" style={{ color: '#a08060' }}>
          Voices from Our Community
        </p>
        <h2 className="text-center font-bold mb-14"
          style={{ color: '#2a1f17', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', lineHeight: '1.3' }}>
          What families say
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-3xl p-8 flex flex-col"
              style={{ background: 'white', boxShadow: '0 2px 24px rgba(90,60,30,0.08)' }}>
              <span className="text-5xl leading-none mb-4 font-serif" style={{ color: '#C9A435' }}>&ldquo;</span>
              <p className="leading-relaxed flex-1 mb-7" style={{ color: '#5a4a3a', fontSize: '1.03rem', lineHeight: '1.75' }}>
                {t.testimonial_text}
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #f0e8dc' }}>
                {t.photo_url && (
                  <img src={t.photo_url} alt={t.name_display}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid #e8ddd0' }} />
                )}
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2a1f17' }}>{t.name_display}</p>
                  {t.role_description && (
                    <p className="text-xs mt-0.5" style={{ color: '#a08060' }}>{t.role_description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="/testimonials"
            className="text-sm font-medium inline-flex items-center gap-2 transition-all hover:gap-3"
            style={{ color: '#C9A435' }}>
            Share your family&apos;s story →
          </a>
        </div>
      </div>
    </section>
  )
}

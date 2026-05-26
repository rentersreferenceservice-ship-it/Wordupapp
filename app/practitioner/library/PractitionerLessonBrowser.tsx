'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Lesson } from '@/lib/types'

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Relationships: ['relationship','relationships','dating','romance','romantic','marriage','wedding','divorce','breakup','trust','boundaries','consent','intimacy','attraction','spouse','couple','boyfriend','girlfriend','crush','social connection','healthy relationship','communication skills'],
  History: ['history','historical','ancient','medieval','colonial','civilization','empire','revolution','revolutionary','civil war','world war','ww1','ww2','wwii','cold war','president','constitution','declaration','independence','democracy','government','congress','abraham lincoln','george washington','martin luther king','harriet tubman','rosa parks','slavery','abolition','suffrage','rights movement','holocaust','genocide','greek','roman','viking','aztec','mayan','inca','mesopotamia','war','battle','soldier','army','navy','military','treaty','election','explorer','columbus','pilgrims','pioneer','westward','gold rush','century','decade','era','period','dynasty','royal','royalty','royalties','king','queen','prince','princess','monarch','monarchy','throne','crown','castle','knight','noble','aristocrat','feudal'],
  Geography: ['geography','continent','country','countries','nation','capital','city','cities','europe','european','asia','asian','africa','african','australia','oceania','north america','south america','latin america','middle east','cobblestone','landmark','monument','culture','cultural','tradition','customs','map','compass','latitude','longitude','equator','hemisphere','flag','population','immigration','border','region','france','germany','spain','italy','england','britain','japan','china','india','brazil','mexico','canada','russia','egypt','kenya','nigeria','neighborhood','urban','rural','suburban','village','town'],
  Academics: ['ged','academics','academic','exam','test prep','standardized test','high school equivalency','diploma','degree','college','university','scholarship','homework','tutoring','curriculum'],
  Science: ['animal','frog','toad','amphibian','reptile','lizard','snake','turtle','crocodile','alligator','mammal','dog','cat','horse','cow','whale','dolphin','shark','fish','bird','eagle','owl','penguin','insect','butterfly','bee','ant','spider','bug','worm','beetle','dragonfly','moth','dinosaur','fossil','extinct','predator','prey','habitat','hibernate','plant','tree','flower','seed','leaf','root','photosynthesis','ecosystem','ecology','forest','jungle','rainforest','desert','ocean','reef','wetland','biome','nature','cell','bacteria','virus','germ','immune','dna','genetics','evolution','organism','volcano','earthquake','rock','mineral','crystal','geology','mountain','weather','hurricane','tornado','cloud','climate','atmosphere','science','biology','chemistry','physics','element','atom','molecule','gravity','magnet','electricity','chemical','experiment','laboratory','space','astronomy','nasa','artemis','moon','planet','star','galaxy','solar','sun','mars','jupiter','saturn','comet','asteroid','telescope','orbit','rocket','astronaut','universe','black hole','nebula'],
  Math: ['math','mathematics','geometry','algebra','calculus','statistics','number','counting','fraction','decimal','percent','ratio','addition','subtraction','multiplication','division','equation','shape','triangle','circle','square','rectangle','polygon','measurement','area','perimeter','volume','graph','probability'],
  'Language Arts': ['writing','reading','grammar','paragraph','sentence','vocabulary','spelling','literature','story','novel','poem','poetry','author','character','plot','metaphor','simile','figurative','punctuation','essay','narrative','alphabet','letter','word','language','communication','speech','debate','shakespeare','fiction','nonfiction','biography','memoir'],
  'Social Emotional': ['emotion','feeling','feelings','sel','mental health','social skills','friendship','kindness','empathy','compassion','gratitude','respect','selfcare','self-care','anxiety','confidence','self-esteem','mindfulness','anger','fear','sadness','happiness','joy','worry','stress','calm','bullying','inclusion','teamwork','cooperation','conflict','resolution'],
  Health: ['health','nutrition','fitness','exercise','hygiene','sleep','wellness','food','vegetable','fruit','vitamin','protein','diet','hydration','water','muscle','bone','heart','lung','stomach','organ','brain','nervous system','dentist','doctor','medicine','vaccine','disease','diabetes','allergy','puberty','growth','development'],
  Technology: ['technology','computer','coding','programming','robot','robotics','internet','digital','software','hardware','artificial intelligence','ai','stem','engineering','machine','invention','innovate','design','app','smartphone','tablet','video game','social media','cybersecurity','3d printing','drone','electric','renewable','solar panel','battery'],
  Arts: ['art','artist','painting','drawing','sculpture','pottery','craft','music','musician','song','singing','instrument','piano','guitar','violin','orchestra','symphony','jazz','classical','hip hop','rap','opera','dance','ballet','theater','drama','acting','film','movie','animation','creative','imagination','design','color','portrait','landscape','mozart','beethoven','picasso','shakespeare'],
}

function detectSubject(lesson: Lesson): string {
  const searchText = [lesson.title, lesson.topic, ...(lesson.hashtags ?? [])].join(' ').toLowerCase().replace(/#/g, '')
  const subjectNames: Record<string, string> = { 'ged':'Academics','academics':'Academics','relationship':'Relationships','relationships':'Relationships','geography':'Geography','science':'Science','history':'History','math':'Math','mathematics':'Math','language arts':'Language Arts','social emotional':'Social Emotional','health':'Health','technology':'Technology','arts':'Arts','art':'Arts','music':'Arts' }
  for (const [name, subject] of Object.entries(subjectNames)) {
    if ([lesson.title, lesson.topic].join(' ').toLowerCase().includes(name)) return subject
  }
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => searchText.includes(k))) return subject
  }
  return 'Other'
}

const AGE_GROUPS = ['All Ages','Young Children (ages 6–8)','Children (ages 9–11)','Tweens (ages 12–14)','Teens (ages 15–17)','Adults (18+)']
const SUBJECTS = ['All Subjects', ...Object.keys(SUBJECT_KEYWORDS), 'Other']

function SuggestEditModal({ lessons, onClose }: { lessons: Lesson[]; onClose: () => void }) {
  const [lessonTitle, setLessonTitle] = useState('')
  const [hunkNumber, setHunkNumber] = useState('')
  const [whatToEdit, setWhatToEdit] = useState('')
  const [citation, setCitation] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lessonTitle.trim() || !whatToEdit.trim()) {
      setError('Please fill in the lesson name and what needs to be edited.')
      return
    }
    setSending(true)
    setError('')
    const res = await fetch('/api/suggest-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonTitle, hunkNumber, whatToEdit, citation }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
      setTimeout(onClose, 2000)
    } else {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Suggest an Edit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-semibold text-lg">Sent!</p>
            <p className="text-sm text-gray-500 mt-1">Thank you — we&apos;ll review your suggestion.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                placeholder="e.g. Photosynthesis"
                list="lesson-titles"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="lesson-titles">
                {lessons.map(l => <option key={l.id} value={l.title} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hunk Number</label>
              <input
                type="number"
                min={1}
                max={8}
                value={hunkNumber}
                onChange={e => setHunkNumber(e.target.value)}
                placeholder="1–8"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What needs to be edited <span className="text-red-500">*</span></label>
              <textarea
                value={whatToEdit}
                onChange={e => setWhatToEdit(e.target.value)}
                placeholder="Describe what is incorrect or needs improvement…"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supporting link / citation <span className="text-gray-400 font-normal">(required for factual corrections)</span></label>
              <input
                type="url"
                value={citation}
                onChange={e => setCitation(e.target.value)}
                placeholder="https://…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {sending ? 'Sending…' : 'Submit Suggestion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function PractitionerLessonBrowser({ lessons }: { lessons: Lesson[] }) {
  const [ageFilter, setAgeFilter] = useState('All Ages')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [search, setSearch] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)

  const lessonNumbers = useMemo(() => {
    const sorted = [...lessons].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const counters: Record<string, number> = {}
    const numbers: Record<string, number> = {}
    for (const lesson of sorted) {
      const key = `${detectSubject(lesson)}|${lesson.ageGroup}`
      counters[key] = (counters[key] ?? 0) + 1
      numbers[lesson.id] = counters[key]
    }
    return numbers
  }, [lessons])

  const filtered = useMemo(() => {
    return lessons.filter(lesson => {
      const ageMatch = ageFilter === 'All Ages' || lesson.ageGroup === ageFilter
      const subjectMatch = subjectFilter === 'All Subjects' || detectSubject(lesson) === subjectFilter
      const searchMatch = !search || lesson.title.toLowerCase().includes(search.toLowerCase()) || lesson.topic?.toLowerCase().includes(search.toLowerCase())
      return ageMatch && subjectMatch && searchMatch
    })
  }, [lessons, ageFilter, subjectFilter, search])

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {showSuggest && <SuggestEditModal lessons={lessons} onClose={() => setShowSuggest(false)} />}
      <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
        <div>
          <Link href="/practitioner/dashboard" className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors mb-3">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">Practitioner Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.filter(l => l.practitionerId).length} private · {lessons.filter(l => !l.practitionerId).length} public</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link href="/practitioner/generate" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors text-center">
            + Generate Lesson
          </Link>
          <Link href="/practitioner/submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center">
            Upload Lesson
          </Link>
          <button
            onClick={() => setShowSuggest(true)}
            className="bg-amber-50 border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors text-center"
          >
            Suggest Edits
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search lessons…"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)} className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none cursor-pointer">
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none cursor-pointer">
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(ageFilter !== 'All Ages' || subjectFilter !== 'All Subjects' || search) && (
          <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects'); setSearch('') }} className="text-sm text-gray-400 hover:text-gray-700 underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {lessons.length === 0 ? (
            <>
              <p className="text-gray-500 font-medium mb-2">No lessons yet.</p>
              <p className="text-sm mb-4">Generate your first private lesson, or public lessons will appear here once created.</p>
              <Link href="/practitioner/generate" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                + Generate a Lesson
              </Link>
            </>
          ) : (
            <>
              <p>No lessons match these filters.</p>
              <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects'); setSearch('') }} className="text-blue-600 text-sm hover:underline mt-2">Clear filters</button>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(lesson => (
            <li key={lesson.id}>
              <Link href={`/practitioner/lessons/${lesson.id}`} className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-500 hover:shadow-md transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{lesson.title}</span>
                  {!lesson.practitionerId && (
                    <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Public</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5 flex gap-2 flex-wrap items-center">
                  <span className="font-semibold text-blue-600">#{lessonNumbers[lesson.id]}</span>
                  <span>·</span>
                  <span>{lesson.ageGroup}</span>
                  <span>·</span>
                  <span>{detectSubject(lesson)}</span>
                  <span>·</span>
                  <span>{new Date(lesson.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

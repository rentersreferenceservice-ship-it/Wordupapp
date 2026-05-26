'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson } from '@/lib/types'

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Relationships: ['relationship','relationships','dating','romance','romantic','marriage','wedding','divorce','breakup','trust','boundaries','consent','intimacy','attraction','spouse','couple','boyfriend','girlfriend','crush'],
  History: ['history','historical','ancient','medieval','colonial','civilization','empire','revolution','revolutionary','civil war','world war','ww1','ww2','wwii','cold war','president','constitution','declaration','independence','democracy','government','war','battle','soldier','army','navy','military','treaty','election','explorer','columbus','pilgrims','pioneer','westward','century','decade','era','period','dynasty','royal','royalty','royalties','king','queen','prince','princess','monarch','monarchy'],
  Geography: ['geography','continent','country','countries','nation','capital','city','cities','europe','european','asia','asian','africa','african','australia','north america','south america','latin america','middle east','cobblestone','landmark','monument','culture','cultural','tradition','customs','map','flag','population','immigration','border','region','france','germany','spain','italy','england','britain','japan','china','india','brazil','mexico','canada','russia','egypt'],
  Academics: ['ged','academics','academic','exam','test prep','standardized test','high school equivalency','diploma','degree','college','university','scholarship'],
  Science: ['animal','frog','toad','amphibian','reptile','mammal','dog','cat','horse','cow','whale','dolphin','shark','fish','bird','eagle','owl','penguin','insect','butterfly','bee','ant','spider','dinosaur','fossil','extinct','plant','tree','flower','seed','leaf','root','photosynthesis','ecosystem','ecology','forest','jungle','rainforest','desert','ocean','reef','biome','nature','cell','bacteria','virus','germ','immune','dna','genetics','evolution','volcano','earthquake','rock','mineral','geology','mountain','weather','hurricane','tornado','cloud','climate','atmosphere','science','biology','chemistry','physics','element','atom','molecule','gravity','magnet','electricity','experiment','laboratory','space','astronomy','nasa','moon','planet','star','galaxy','solar','sun','mars','jupiter','saturn','comet','asteroid','telescope','orbit','rocket','astronaut','universe'],
  Math: ['math','mathematics','geometry','algebra','calculus','statistics','number','counting','fraction','decimal','percent','ratio','addition','subtraction','multiplication','division','equation','shape','triangle','circle','square','rectangle','measurement','area','perimeter','volume','graph','probability'],
  'Language Arts': ['writing','reading','grammar','paragraph','sentence','vocabulary','spelling','literature','story','novel','poem','poetry','author','character','plot','metaphor','simile','punctuation','essay','narrative','alphabet','letter','word','language','communication','speech'],
  'Social Emotional': ['emotion','feeling','feelings','sel','mental health','social skills','friendship','kindness','empathy','compassion','gratitude','respect','anxiety','confidence','self-esteem','mindfulness','anger','fear','sadness','happiness','joy','worry','stress','calm','bullying','inclusion','teamwork','cooperation'],
  Health: ['health','nutrition','fitness','exercise','hygiene','sleep','wellness','food','vegetable','fruit','vitamin','protein','diet','hydration','muscle','bone','heart','lung','stomach','organ','brain','dentist','doctor','medicine','vaccine','disease','diabetes','allergy','puberty'],
  Technology: ['technology','computer','coding','programming','robot','robotics','internet','digital','software','hardware','artificial intelligence','ai','stem','engineering','machine','invention','app','smartphone','tablet','video game','social media'],
  Arts: ['art','artist','painting','drawing','sculpture','pottery','craft','music','musician','song','singing','instrument','piano','guitar','violin','orchestra','jazz','classical','dance','ballet','theater','drama','acting','film','movie','animation','creative','imagination'],
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

export default function StartSessionButton({ studentId, studentName, lessons }: {
  studentId: string
  studentName: string
  lessons: Lesson[]
}) {
  const router = useRouter()
  const [selectedLesson, setSelectedLesson] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('All Ages')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')

  const filtered = useMemo(() => {
    return lessons.filter(lesson => {
      const ageMatch = ageFilter === 'All Ages' || lesson.ageGroup === ageFilter
      const subjectMatch = subjectFilter === 'All Subjects' || detectSubject(lesson) === subjectFilter
      const searchMatch = !search || lesson.title.toLowerCase().includes(search.toLowerCase()) || lesson.topic?.toLowerCase().includes(search.toLowerCase())
      return ageMatch && subjectMatch && searchMatch
    })
  }, [lessons, ageFilter, subjectFilter, search])

  async function handleStart() {
    if (!selectedLesson) return
    setLoading(true)
    const res = await fetch('/api/practitioner/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lessonId: selectedLesson, sessionDate: date }),
    })
    const data = await res.json()
    if (data.sessionId) {
      router.push(`/practitioner/session/${data.sessionId}`)
    }
    setLoading(false)
  }

  const selectedTitle = lessons.find(l => l.id === selectedLesson)?.title

  return (
    <div className="space-y-3">
      {/* Search and filters */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search lessons…"
        className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <div className="flex gap-2 flex-wrap">
        <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)} className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-xs bg-yellow-300 font-semibold text-gray-800 focus:outline-none cursor-pointer">
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-xs bg-yellow-300 font-semibold text-gray-800 focus:outline-none cursor-pointer">
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(ageFilter !== 'All Ages' || subjectFilter !== 'All Subjects' || search) && (
          <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects'); setSearch('') }} className="text-xs text-gray-400 hover:text-gray-700 underline">
            Clear
          </button>
        )}
      </div>

      {/* Lesson list */}
      <div className="max-h-52 overflow-y-auto border border-blue-100 rounded-lg bg-white divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No lessons match.</p>
        ) : (
          filtered.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLesson(l.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedLesson === l.id ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-gray-800'}`}
            >
              <span className="font-medium">{l.title}</span>
              <span className={`ml-2 text-xs ${selectedLesson === l.id ? 'text-blue-200' : 'text-gray-400'}`}>{l.ageGroup} · {detectSubject(l)}</span>
            </button>
          ))
        )}
      </div>

      {/* Date + Start */}
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleStart}
          disabled={!selectedLesson || loading}
          className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Starting…' : selectedLesson ? `Start: ${selectedTitle}` : 'Select a lesson'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Lesson } from '@/lib/types'

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Relationships: [
    'relationship', 'relationships', 'dating', 'romance', 'romantic',
    'marriage', 'wedding', 'divorce', 'breakup',
    'trust', 'boundaries', 'consent', 'intimacy', 'attraction',
    'spouse', 'couple', 'boyfriend', 'girlfriend', 'crush',
    'social connection', 'healthy relationship', 'communication skills',
  ],
  History: [
    'history', 'historical', 'ancient', 'medieval', 'colonial', 'civilization', 'empire',
    'revolution', 'revolutionary', 'civil war', 'world war', 'ww1', 'ww2', 'wwii', 'cold war',
    'president', 'constitution', 'declaration', 'independence', 'democracy', 'government', 'congress',
    'abraham lincoln', 'george washington', 'martin luther king', 'harriet tubman', 'rosa parks',
    'slavery', 'abolition', 'suffrage', 'rights movement', 'holocaust', 'genocide',
    'greek', 'roman', 'viking', 'aztec', 'mayan', 'inca', 'mesopotamia',
    'war', 'battle', 'soldier', 'army', 'navy', 'military', 'treaty', 'election',
    'explorer', 'columbus', 'pilgrims', 'pioneer', 'westward', 'gold rush',
    'century', 'decade', 'era', 'period', 'dynasty',
    'royal', 'royalty', 'royalties', 'king', 'queen', 'prince', 'princess', 'monarch', 'monarchy',
    'throne', 'crown', 'castle', 'knight', 'noble', 'aristocrat', 'feudal',
  ],
  Geography: [
    'geography', 'continent', 'country', 'countries', 'nation', 'capital', 'city', 'cities',
    'europe', 'european', 'asia', 'asian', 'africa', 'african', 'australia', 'oceania',
    'north america', 'south america', 'latin america', 'middle east',
    'cobblestone', 'landmark', 'monument', 'culture', 'cultural', 'tradition', 'customs',
    'map', 'compass', 'latitude', 'longitude', 'equator', 'hemisphere',
    'flag', 'population', 'immigration', 'border', 'region',
    'france', 'germany', 'spain', 'italy', 'england', 'britain', 'japan', 'china', 'india',
    'brazil', 'mexico', 'canada', 'russia', 'egypt', 'kenya', 'nigeria',
    'neighborhood', 'urban', 'rural', 'suburban', 'village', 'town',
  ],
  Academics: [
    'ged', 'academics', 'academic', 'exam', 'test prep', 'standardized test',
    'high school equivalency', 'diploma', 'degree', 'college', 'university', 'scholarship',
    'homework', 'tutoring', 'curriculum',
  ],
  Science: [
    // Life science — animals
    'animal', 'frog', 'toad', 'amphibian', 'reptile', 'lizard', 'snake', 'turtle', 'crocodile', 'alligator',
    'mammal', 'dog', 'cat', 'horse', 'cow', 'whale', 'dolphin', 'shark', 'fish', 'bird', 'eagle', 'owl', 'penguin',
    'insect', 'butterfly', 'bee', 'ant', 'spider', 'bug', 'worm', 'beetle', 'dragonfly', 'moth',
    'dinosaur', 'fossil', 'extinct', 'predator', 'prey', 'habitat', 'hibernate',
    // Life science — plants & ecology
    'plant', 'tree', 'flower', 'seed', 'leaf', 'root', 'photosynthesis', 'ecosystem', 'ecology',
    'forest', 'jungle', 'rainforest', 'desert', 'ocean', 'reef', 'wetland', 'biome', 'nature',
    // Life science — body & health science
    'cell', 'bacteria', 'virus', 'germ', 'immune', 'dna', 'genetics', 'evolution', 'organism',
    // Earth science
    'volcano', 'earthquake', 'rock', 'mineral', 'crystal', 'geology',
    'mountain', 'weather', 'hurricane', 'tornado', 'cloud', 'climate', 'atmosphere',
    // Physical science
    'science', 'biology', 'chemistry', 'physics', 'element', 'atom', 'molecule',
    'gravity', 'magnet', 'electricity', 'chemical', 'experiment', 'laboratory',
    // Space
    'space', 'astronomy', 'nasa', 'artemis', 'moon', 'planet', 'star', 'galaxy', 'solar', 'sun',
    'mars', 'jupiter', 'saturn', 'comet', 'asteroid', 'telescope', 'orbit', 'rocket', 'astronaut',
    'universe', 'black hole', 'nebula',
  ],
  Math: [
    'math', 'mathematics', 'geometry', 'algebra', 'calculus', 'statistics',
    'number', 'counting', 'fraction', 'decimal', 'percent', 'ratio',
    'addition', 'subtraction', 'multiplication', 'division', 'equation',
    'shape', 'triangle', 'circle', 'square', 'rectangle', 'polygon',
    'measurement', 'area', 'perimeter', 'volume', 'graph', 'probability',
  ],
  'Language Arts': [
    'writing', 'reading', 'grammar', 'paragraph', 'sentence', 'vocabulary', 'spelling',
    'literature', 'story', 'novel', 'poem', 'poetry', 'author', 'character', 'plot',
    'metaphor', 'simile', 'figurative', 'punctuation', 'essay', 'narrative',
    'alphabet', 'letter', 'word', 'language', 'communication', 'speech', 'debate',
    'shakespeare', 'fiction', 'nonfiction', 'biography', 'memoir',
  ],
  'Social Emotional': [
    'emotion', 'feeling', 'feelings', 'sel', 'mental health', 'social skills',
    'friendship', 'kindness', 'empathy', 'compassion', 'gratitude', 'respect',
    'selfcare', 'self-care', 'anxiety', 'confidence', 'self-esteem', 'mindfulness',
    'anger', 'fear', 'sadness', 'happiness', 'joy', 'worry', 'stress', 'calm',
    'bullying', 'inclusion', 'teamwork', 'cooperation', 'conflict', 'resolution',
  ],
  Health: [
    'health', 'nutrition', 'fitness', 'exercise', 'hygiene', 'sleep', 'wellness',
    'food', 'vegetable', 'fruit', 'vitamin', 'protein', 'diet', 'hydration', 'water',
    'muscle', 'bone', 'heart', 'lung', 'stomach', 'organ', 'brain', 'nervous system',
    'dentist', 'doctor', 'medicine', 'vaccine', 'disease', 'diabetes', 'allergy',
    'puberty', 'growth', 'development',
  ],
  Technology: [
    'technology', 'computer', 'coding', 'programming', 'robot', 'robotics',
    'internet', 'digital', 'software', 'hardware', 'artificial intelligence', 'ai',
    'stem', 'engineering', 'machine', 'invention', 'innovate', 'design',
    'app', 'smartphone', 'tablet', 'video game', 'social media', 'cybersecurity',
    '3d printing', 'drone', 'electric', 'renewable', 'solar panel', 'battery',
  ],
  Arts: [
    'art', 'artist', 'painting', 'drawing', 'sculpture', 'pottery', 'craft',
    'music', 'musician', 'song', 'singing', 'instrument', 'piano', 'guitar', 'violin',
    'orchestra', 'symphony', 'jazz', 'classical', 'hip hop', 'rap', 'opera',
    'dance', 'ballet', 'theater', 'drama', 'acting', 'film', 'movie', 'animation',
    'creative', 'imagination', 'design', 'color', 'portrait', 'landscape',
    'mozart', 'beethoven', 'picasso', 'shakespeare',
  ],
}

function detectSubject(lesson: Lesson): string {
  const searchText = [
    lesson.title,
    lesson.topic,
    ...(lesson.hashtags ?? []),
  ].join(' ').toLowerCase().replace(/#/g, '')

  // Direct subject name match in title/topic takes priority
  const subjectNames: Record<string, string> = {
    'ged': 'Academics',
    'academics': 'Academics',
    'relationship': 'Relationships',
    'relationships': 'Relationships',
    'geography': 'Geography',
    'science': 'Science',
    'history': 'History',
    'math': 'Math',
    'mathematics': 'Math',
    'language arts': 'Language Arts',
    'social emotional': 'Social Emotional',
    'health': 'Health',
    'technology': 'Technology',
    'arts': 'Arts',
    'art': 'Arts',
    'music': 'Arts',
  }
  for (const [name, subject] of Object.entries(subjectNames)) {
    const titleTopic = [lesson.title, lesson.topic].join(' ').toLowerCase()
    if (titleTopic.includes(name)) return subject
  }

  // Fall back to keyword matching
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => searchText.includes(k))) return subject
  }
  return 'Other'
}

const AGE_GROUPS = [
  'All Ages',
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

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
    if (res.ok) { setSent(true); setTimeout(onClose, 2000) }
    else setError('Something went wrong. Please try again.')
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
              <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Photosynthesis" list="lesson-titles-pub"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <datalist id="lesson-titles-pub">{lessons.map(l => <option key={l.id} value={l.title} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hunk Number</label>
              <input type="number" min={1} max={8} value={hunkNumber} onChange={e => setHunkNumber(e.target.value)} placeholder="1–8"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What needs to be edited <span className="text-red-500">*</span></label>
              <textarea value={whatToEdit} onChange={e => setWhatToEdit(e.target.value)} placeholder="Describe what is incorrect or needs improvement…" rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supporting link / citation <span className="text-gray-400 font-normal">(required for factual corrections)</span></label>
              <input type="url" value={citation} onChange={e => setCitation(e.target.value)} placeholder="https://…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={sending}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {sending ? 'Sending…' : 'Submit Suggestion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LessonBrowser({ lessons, isSubscribed = false }: { lessons: Lesson[]; isSubscribed?: boolean }) {
  const [ageFilter, setAgeFilter] = useState('All Ages')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [search, setSearch] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)

  // Build a lesson number per subject+ageGroup combo (oldest first = #1)
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
    <main className="relative z-10 min-h-screen px-4 py-10 max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
      {showSuggest && <SuggestEditModal lessons={lessons} onClose={() => setShowSuggest(false)} />}

      {/* Verified explanation note */}
      <div className="mb-4 bg-green-50 border-2 border-black rounded-xl px-5 py-4">
        <p className="text-sm text-green-900"><span className="font-bold">✓ Verified for Accuracy</span> — Lessons marked Verified have completed a three-step accuracy review: AI generation, plus independent AI review by Perplexity AI (real-time web search with cited sources) and Claude Opus by Anthropic (advanced AI reasoning and knowledge). Reviewed by the Word Up team.</p>
      </div>

      {/* Preview banner for non-subscribers */}
      {!isSubscribed && (
        <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-yellow-800">You&apos;re browsing in preview mode</p>
            <p className="text-xs text-yellow-700 mt-0.5">Open any lesson to see the first section. Subscribe to access all hunks, copy, print, and use lessons in sessions.</p>
          </div>
          <a href="/subscribe" className="shrink-0 bg-yellow-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors whitespace-nowrap">
            Subscribe $9.99/mo
          </a>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 bg-white border-4 border-gray-300 rounded-xl px-5 py-4">
        <div>
          <Link href="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3">← Generate Lesson</Link>
          <h1 className="text-2xl font-bold text-gray-900">Saved Lessons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} saved</p>
          <p className="text-sm text-gray-500 font-medium mt-1">worduplessongenerator.com &nbsp;·&nbsp; wordups2c@gmail.com</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center">
            + New Lesson
          </Link>
          <Link href="/submit" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center">
            Submit a Lesson
          </Link>
          <button
            onClick={() => setShowSuggest(true)}
            className="bg-yellow-200 border-2 border-blue-600 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors text-center"
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
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={ageFilter}
          onChange={e => setAgeFilter(e.target.value)}
          className="border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm bg-yellow-200 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer"
        >
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm bg-yellow-200 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer"
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(ageFilter !== 'All Ages' || subjectFilter !== 'All Subjects' || search) && (
          <button
            onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects'); setSearch('') }}
            className="text-sm text-gray-400 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No lessons yet.</p>
          <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Generate your first lesson</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No lessons match these filters.</p>
          <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects'); setSearch('') }} className="text-blue-600 text-sm hover:underline mt-2">Clear filters</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(lesson => (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block bg-white border-4 border-gray-300 rounded-xl px-5 py-4 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{lesson.title}</span>
                  {lesson.verified && (
                    <span className="inline-flex items-center gap-1 bg-green-50 border border-green-300 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
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
      </div>{/* end left column */}

      {/* Practitioner sidebar */}
      <aside className="lg:w-72 shrink-0">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-5 sticky top-6">
          <p className="text-sm font-bold text-blue-900 mb-1">Are you an S2C Practitioner?</p>
          <p className="text-xs text-blue-800 mb-3">The <span className="font-semibold">Word Up Practitioner Dashboard</span> lets you manage your caseload, run sessions with live scoring, generate invoices, and track student progress — all in one place.</p>
          <p className="text-xs text-blue-700 font-semibold mb-4">Start your 30-day free trial today — no charge until your trial ends.</p>
          <a
            href="/practitioner/get-started"
            className="block bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors text-center"
          >
            Explore the Practitioner Dashboard →
          </a>
        </div>
      </aside>

      </div>{/* end flex row */}
    </main>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Lesson } from '@/lib/types'

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Relationships: [
    'relationship', 'relationships', 'dating', 'romance', 'romantic', 'love', 'marriage', 'wedding',
    'family', 'sibling', 'parent', 'mother', 'father', 'brother', 'sister', 'grandparent',
    'trust', 'boundaries', 'consent', 'communication', 'intimacy', 'attraction', 'breakup',
    'divorce', 'partner', 'spouse', 'couple', 'boyfriend', 'girlfriend', 'crush',
    'community', 'neighbor', 'peer', 'colleague', 'social connection',
  ],
  Geography: [
    'geography', 'continent', 'country', 'countries', 'nation', 'capital', 'city', 'cities',
    'europe', 'european', 'asia', 'asian', 'africa', 'african', 'australia', 'oceania',
    'north america', 'south america', 'latin america', 'middle east',
    'cobblestone', 'landmark', 'monument', 'culture', 'cultural', 'tradition', 'customs',
    'language', 'map', 'compass', 'latitude', 'longitude', 'equator', 'hemisphere',
    'flag', 'population', 'immigration', 'migration', 'border', 'region',
    'france', 'germany', 'spain', 'italy', 'england', 'britain', 'japan', 'china', 'india',
    'brazil', 'mexico', 'canada', 'australia', 'russia', 'egypt', 'kenya', 'nigeria',
    'community', 'neighborhood', 'urban', 'rural', 'suburban', 'village', 'town',
  ],
  Science: [
    // Life science — animals
    'animal', 'frog', 'toad', 'amphibian', 'reptile', 'lizard', 'snake', 'turtle', 'crocodile', 'alligator',
    'mammal', 'dog', 'cat', 'horse', 'cow', 'whale', 'dolphin', 'shark', 'fish', 'bird', 'eagle', 'owl', 'penguin',
    'insect', 'butterfly', 'bee', 'ant', 'spider', 'bug', 'worm', 'beetle', 'dragonfly', 'moth',
    'dinosaur', 'fossil', 'extinct', 'predator', 'prey', 'habitat', 'migration', 'hibernate',
    // Life science — plants & ecology
    'plant', 'tree', 'flower', 'seed', 'leaf', 'root', 'photosynthesis', 'ecosystem', 'ecology',
    'forest', 'jungle', 'rainforest', 'desert', 'ocean', 'reef', 'wetland', 'biome', 'nature',
    // Life science — body & health science
    'cell', 'bacteria', 'virus', 'germ', 'immune', 'dna', 'genetics', 'evolution', 'organism',
    // Earth science
    'earth', 'volcano', 'earthquake', 'rock', 'mineral', 'crystal', 'geology', 'fossil', 'river',
    'mountain', 'weather', 'hurricane', 'tornado', 'cloud', 'rain', 'snow', 'climate', 'atmosphere',
    // Physical science
    'science', 'biology', 'chemistry', 'physics', 'element', 'atom', 'molecule', 'energy', 'force',
    'gravity', 'magnet', 'electricity', 'light', 'sound', 'heat', 'chemical', 'reaction', 'experiment',
    // Space
    'space', 'astronomy', 'nasa', 'artemis', 'moon', 'planet', 'star', 'galaxy', 'solar', 'sun',
    'mars', 'jupiter', 'saturn', 'comet', 'asteroid', 'telescope', 'orbit', 'rocket', 'astronaut',
    'universe', 'black hole', 'nebula',
  ],
  Academics: [
    'ged', 'academics', 'academic', 'study', 'studying', 'exam', 'test prep', 'standardized test',
    'high school equivalency', 'diploma', 'degree', 'college', 'university', 'scholarship',
    'homework', 'tutoring', 'curriculum', 'lesson plan', 'learning',
  ],
  History: [
    'history', 'historical', 'ancient', 'medieval', 'colonial', 'civilization', 'empire',
    'revolution', 'revolutionary', 'civil war', 'world war', 'ww1', 'ww2', 'wwii', 'cold war',
    'president', 'constitution', 'declaration', 'independence', 'democracy', 'government', 'congress',
    'abraham lincoln', 'george washington', 'martin luther king', 'harriet tubman', 'rosa parks',
    'slavery', 'abolition', 'suffrage', 'rights movement', 'holocaust', 'genocide',
    'egypt', 'greek', 'roman', 'viking', 'aztec', 'mayan', 'inca', 'mesopotamia',
    'war', 'battle', 'soldier', 'army', 'navy', 'military', 'treaty', 'election',
    'explorer', 'columbus', 'pilgrims', 'pioneer', 'westward', 'gold rush',
    'century', 'decade', 'era', 'period', 'dynasty',
    'royal', 'royalty', 'royalties', 'king', 'queen', 'prince', 'princess', 'monarch', 'monarchy',
    'throne', 'crown', 'castle', 'knight', 'noble', 'court', 'aristocrat', 'feudal',
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

export default function LessonBrowser({ lessons }: { lessons: Lesson[] }) {
  const [ageFilter, setAgeFilter] = useState('All Ages')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')

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
      return ageMatch && subjectMatch
    })
  }, [lessons, ageFilter, subjectFilter])

  return (
    <main className="relative z-10 min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-white border-4 border-gray-300 rounded-xl px-5 py-4">
        <div>
          <Link href="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3">← Generate Lesson</Link>
          <h1 className="text-2xl font-bold text-gray-900">Saved Lessons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Lesson
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={ageFilter}
          onChange={e => setAgeFilter(e.target.value)}
          className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
        >
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(ageFilter !== 'All Ages' || subjectFilter !== 'All Subjects') && (
          <button
            onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects') }}
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
          <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects') }} className="text-blue-600 text-sm hover:underline mt-2">Clear filters</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(lesson => (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block bg-white border-4 border-gray-300 rounded-xl px-5 py-4 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="font-medium text-gray-900">{lesson.title}</div>
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

'use client'

import AccuracyChart from '@/app/AccuracyChart'
import type { SessionAccuracy } from '@/lib/practitionerStore'

// Real accuracy data from an anonymized adult speller — 11 sessions, Apr–Jun 2026
const CRAIG_DATA: SessionAccuracy[] = [
  { sessionId: '781ded62', date: '2026-04-28', accuracy: 79,  lessonTitle: 'Lesson 1',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: 'e4c55f69', date: '2026-04-28', accuracy: 82,  lessonTitle: 'Lesson 2',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: '8b85daaa', date: '2026-04-30', accuracy: 71,  lessonTitle: 'Lesson 3',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: '7fd2207e', date: '2026-04-30', accuracy: 91,  lessonTitle: 'Lesson 4',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: 'ca5a94f3', date: '2026-05-06', accuracy: 74,  lessonTitle: 'Lesson 5',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: '3edf6fbf', date: '2026-05-06', accuracy: 83,  lessonTitle: 'Lesson 6',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: 'e0787b2b', date: '2026-05-12', accuracy: 83,  lessonTitle: 'Lesson 7',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: 'ca62aa19', date: '2026-05-18', accuracy: 86,  lessonTitle: 'Lesson 8',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: '2c673259', date: '2026-05-19', accuracy: 76,  lessonTitle: 'Lesson 9',  regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: 'af0d9ef8', date: '2026-05-22', accuracy: 86,  lessonTitle: 'Lesson 10', regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
  { sessionId: '312a50a0', date: '2026-06-06', accuracy: 99,  lessonTitle: 'Lesson 11', regulationArrival: null, regulationDeparture: null, crpId: null, crpName: null, crpColor: null },
]

export default function MockDashboardChart() {
  return <AccuracyChart data={CRAIG_DATA} />
}

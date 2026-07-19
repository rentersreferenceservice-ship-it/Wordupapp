'use client'

import AccuracyChart from '@/app/AccuracyChart'
import type { SessionAccuracy } from '@/lib/practitionerStore'

const SAMPLE_DATA: SessionAccuracy[] = [
  { sessionId: 's1',  date: '2024-09-05', accuracy: 58, lessonTitle: 'The Water Cycle',           regulationArrival: 'dysregulated', regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's2',  date: '2024-09-12', accuracy: 62, lessonTitle: 'Photosynthesis',             regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's3',  date: '2024-09-19', accuracy: 71, lessonTitle: 'The Solar System',           regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's4',  date: '2024-10-03', accuracy: 48, lessonTitle: 'American Revolution',        regulationArrival: 'dysregulated', regulationDeparture: 'dysregulated', crpId: null, crpName: null, crpColor: null },
  { sessionId: 's5',  date: '2024-10-10', accuracy: 55, lessonTitle: 'The Human Brain',            regulationArrival: 'dysregulated', regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's6',  date: '2024-10-17', accuracy: 74, lessonTitle: 'Ancient Egypt',              regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's7',  date: '2024-10-31', accuracy: 79, lessonTitle: 'Ecosystems',                 regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's8',  date: '2024-11-07', accuracy: 83, lessonTitle: 'The Civil Rights Movement',  regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's9',  date: '2024-11-14', accuracy: 65, lessonTitle: 'Volcanoes',                  regulationArrival: 'dysregulated', regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's10', date: '2024-11-21', accuracy: 88, lessonTitle: 'World War II',               regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's11', date: '2024-12-05', accuracy: 91, lessonTitle: 'The James Webb Telescope',   regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
  { sessionId: 's12', date: '2024-12-12', accuracy: 94, lessonTitle: 'Emotions and the Brain',     regulationArrival: 'regulated',    regulationDeparture: 'regulated',    crpId: null, crpName: null, crpColor: null },
]

export default function MockDashboardChart() {
  return <AccuracyChart data={SAMPLE_DATA} />
}

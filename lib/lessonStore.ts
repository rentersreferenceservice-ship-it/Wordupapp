import fs from 'fs'
import path from 'path'
import type { Lesson } from './types'

const DATA_DIR = path.join(process.cwd(), 'data', 'lessons')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function saveLesson(lesson: Lesson): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${lesson.id}.json`)
  fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2), 'utf-8')
}

export function getLesson(id: string): Lesson | null {
  const filePath = path.join(DATA_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Lesson
}

export function listLessons(): Lesson[] {
  ensureDir()
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  return files
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')) as Lesson
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()) as Lesson[]
}

export function deleteLesson(id: string): boolean {
  const filePath = path.join(DATA_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}

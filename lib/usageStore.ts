// Tracks usage counts in memory (resets on server restart in dev, use DB in prod)
// For production, this should be moved to Supabase

import fs from 'fs'
import path from 'path'

const USAGE_FILE = path.join(process.cwd(), 'data', 'usage.json')

interface UserUsage {
  lessonsThisMonth: number
  printsThisMonth: number
  monthKey: string // e.g. "2026-04"
  isSubscribed: boolean
}

interface PendingVerification {
  code: string
  expires: number // timestamp ms
}

interface VerifiedEmail {
  lessonsUsed: number
}

interface UsageData {
  users: Record<string, UserUsage>
  freeVisitors: Record<string, number> // visitorId -> count of free lessons used
  pendingVerifications: Record<string, PendingVerification> // email -> code+expiry
  verifiedEmails: Record<string, VerifiedEmail> // email -> lesson count
}

function getMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function loadUsage(): UsageData {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'))
    }
  } catch {}
  return { users: {}, freeVisitors: {}, pendingVerifications: {}, verifiedEmails: {} }
}

function saveUsage(data: UsageData) {
  fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true })
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2))
}

export function getUserUsage(userId: string): UserUsage {
  const data = loadUsage()
  const monthKey = getMonthKey()
  const usage = data.users[userId]
  if (!usage || usage.monthKey !== monthKey) {
    return { lessonsThisMonth: 0, printsThisMonth: 0, monthKey, isSubscribed: usage?.isSubscribed ?? false }
  }
  return usage
}

export function incrementLessons(userId: string): UserUsage {
  const data = loadUsage()
  const monthKey = getMonthKey()
  const current = data.users[userId]
  const updated: UserUsage = {
    lessonsThisMonth: (current?.monthKey === monthKey ? current.lessonsThisMonth : 0) + 1,
    printsThisMonth: current?.monthKey === monthKey ? current.printsThisMonth : 0,
    monthKey,
    isSubscribed: current?.isSubscribed ?? false,
  }
  data.users[userId] = updated
  saveUsage(data)
  return updated
}

export function incrementPrints(userId: string): UserUsage {
  const data = loadUsage()
  const monthKey = getMonthKey()
  const current = data.users[userId]
  const updated: UserUsage = {
    lessonsThisMonth: current?.monthKey === monthKey ? current.lessonsThisMonth : 0,
    printsThisMonth: (current?.monthKey === monthKey ? current.printsThisMonth : 0) + 1,
    monthKey,
    isSubscribed: current?.isSubscribed ?? false,
  }
  data.users[userId] = updated
  saveUsage(data)
  return updated
}

export function setSubscribed(userId: string, subscribed: boolean) {
  const data = loadUsage()
  const monthKey = getMonthKey()
  const current = data.users[userId]
  data.users[userId] = {
    lessonsThisMonth: current?.monthKey === monthKey ? current.lessonsThisMonth : 0,
    printsThisMonth: current?.monthKey === monthKey ? current.printsThisMonth : 0,
    monthKey,
    isSubscribed: subscribed,
  }
  saveUsage(data)
}

export function getFreeVisitorCount(visitorId: string): number {
  const data = loadUsage()
  return data.freeVisitors[visitorId] ?? 0
}

export function markFreeVisitorUsed(visitorId: string) {
  const data = loadUsage()
  data.freeVisitors[visitorId] = (data.freeVisitors[visitorId] ?? 0) + 1
  saveUsage(data)
}

export const LESSON_LIMIT = 10
export const PRINT_LIMIT = 10
export const FREE_LESSON_LIMIT = 2

export function storePendingVerification(email: string, code: string) {
  const data = loadUsage()
  data.pendingVerifications[email.toLowerCase()] = {
    code,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  }
  saveUsage(data)
}

export function verifyEmailCode(email: string, code: string): boolean {
  const data = loadUsage()
  const pending = data.pendingVerifications[email.toLowerCase()]
  if (!pending) return false
  if (Date.now() > pending.expires) return false
  if (pending.code !== code) return false
  // Mark email as verified with 0 lessons used (if not already there)
  if (!data.verifiedEmails[email.toLowerCase()]) {
    data.verifiedEmails[email.toLowerCase()] = { lessonsUsed: 0 }
  }
  delete data.pendingVerifications[email.toLowerCase()]
  saveUsage(data)
  return true
}

export function getVerifiedEmailUsage(email: string): number {
  const data = loadUsage()
  return data.verifiedEmails[email.toLowerCase()]?.lessonsUsed ?? -1 // -1 means not verified
}

export function incrementVerifiedEmailLesson(email: string) {
  const data = loadUsage()
  const key = email.toLowerCase()
  if (!data.verifiedEmails[key]) data.verifiedEmails[key] = { lessonsUsed: 0 }
  data.verifiedEmails[key].lessonsUsed += 1
  saveUsage(data)
}

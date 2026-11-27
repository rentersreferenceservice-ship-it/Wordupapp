'use client'

import { useState } from 'react'

// One-tap text reminder for a family that hasn't filled out their form.
// The app can't send texts itself, so this opens Messages on the
// practitioner's own phone with the message (and the family's own form
// link) already written. A saved phone number fills in the recipient too.
export default function TextReminder({ requestId, link, studentName, practitionerName, phone: initialPhone }: {
  requestId: string
  link: string
  studentName: string | null
  practitionerName: string
  phone: string | null
}) {
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const message = `Hi! This is ${practitionerName} from Word Up. When you have about 10 minutes, could you fill out this form${studentName ? ` for ${studentName}` : ''}? It helps me plan our sessions. ${link} Thank you!`
  const digits = phone.replace(/[^\d+]/g, '')
  const smsHref = `sms:${digits}?&body=${encodeURIComponent(message)}`

  async function savePhone() {
    await fetch(`/api/practitioner/inquiries/${requestId}/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <input value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => { if (phone !== (initialPhone ?? '')) savePhone() }}
        type="tel" placeholder="Parent's phone (optional)"
        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-44" />
      <a href={smsHref} onClick={() => { if (phone !== (initialPhone ?? '')) savePhone() }}
        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700">💬 Text reminder</a>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }}
        className="text-sm text-gray-500 underline">{copied ? '✓ Copied' : 'Copy message'}</button>
      {saved && <span className="text-xs text-green-700">✓ Number saved</span>}
    </div>
  )
}

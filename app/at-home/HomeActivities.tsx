'use client'

import { useState } from 'react'
import { HOME_ACTIVITIES, HOME_GROUPS, type HomeActivity, type HomeGroup } from '@/lib/homeActivities'

const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const GROUP_COLOR: Record<HomeGroup, { main: string; soft: string; label: string }> = {
  torso: { main: '#ea580c', soft: '#fff7ed', label: 'Torso & Shoulder' },
  arm: { main: '#2563eb', soft: '#eff6ff', label: 'Arm & Reach' },
  wrist: { main: '#7c3aed', soft: '#f5f3ff', label: 'Wrist' },
  finger: { main: '#059669', soft: '#ecfdf5', label: 'Hand & Pointer Finger' },
}

// Opens a printable practice sheet in a new window: a "how to use" box, then
// one full card per activity — what you need, numbered steps, a tip, how
// much, easier/harder, and a Mon–Sun check-off row with a notes line.
function printSheet(activities: HomeActivity[], speller: string) {
  const w = window.open('', '_blank')
  if (!w) return
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span class="day"><span class="box"></span>${d}</span>`).join('')
  const cards = activities.map(a => {
    const c = GROUP_COLOR[a.group]
    return `
    <div class="card" style="border-left-color:${c.main}">
      <div class="top">
        <div class="icon" style="background:${c.soft}">${a.emoji}</div>
        <div>
          <h2>${escape(a.name)}</h2>
          <div class="tags"><span class="tag" style="background:${c.soft};color:${c.main}">${c.label}</span><span class="tag">${escape(a.position)}</span><span class="tag">⏱ ${escape(a.howMuch)}</span></div>
          <p class="why"><b>Why it helps:</b> ${escape(a.builds)}</p>
        </div>
      </div>
      <p class="need"><b>You'll need:</b> ${a.needs.map(escape).join(' · ')}</p>
      <p class="h">How to do it</p>
      <ol>${a.steps.map(s => `<li>${escape(s)}</li>`).join('')}</ol>
      <div class="tip" style="background:${c.soft}"><b>💡 Helpful tip:</b> ${escape(a.tip)}</div>
      <div class="adj"><div><b>Make it easier:</b> ${escape(a.easier)}</div><div><b>Make it harder:</b> ${escape(a.harder)}</div></div>
      <div class="days"><b>Days we practiced:</b> ${days}</div>
      <div class="notes">Notes: ______________________________________________________________</div>
    </div>`
  }).join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Motor Planning at Home</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 28px; }
  header { border-bottom: 3px solid #111; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  header h1 { font-size: 26px; margin: 0; } header .who { font-size: 14px; color: #333; }
  .howto { border: 2px solid #111; border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 14px; }
  .howto b { font-size: 15px; } .howto ul { margin: 6px 0 0 18px; padding: 0; } .howto li { margin: 2px 0; }
  .card { border: 1.5px solid #ccc; border-left: 8px solid; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
  .top { display: flex; gap: 14px; align-items: center; }
  .icon { width: 64px; height: 64px; border-radius: 16px; font-size: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  h2 { font-size: 20px; margin: 0 0 4px; }
  .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
  .tag { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #f3f4f6; color: #374151; font-weight: bold; }
  .why { font-size: 13px; margin: 2px 0 0; color: #333; }
  .need { font-size: 14px; margin: 10px 0 4px; }
  .h { font-size: 15px; font-weight: bold; margin: 8px 0 2px; }
  ol { margin: 0 0 8px 22px; padding: 0; font-size: 15px; line-height: 1.45; }
  .tip { border-radius: 10px; padding: 8px 12px; font-size: 14px; margin-bottom: 8px; }
  .adj { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 10px; }
  .days { display: flex; gap: 12px; align-items: center; font-size: 13px; flex-wrap: wrap; }
  .day { display: inline-flex; align-items: center; gap: 4px; } .box { width: 16px; height: 16px; border: 2px solid #333; border-radius: 3px; display: inline-block; }
  .notes { font-size: 13px; color: #555; margin-top: 10px; }
  .foot { font-size: 11px; color: #777; margin-top: 8px; text-align: center; }
</style></head><body>
<header><h1>🏠 Motor Planning at Home</h1><div class="who">${speller ? `<b>${escape(speller)}</b> · ` : ''}Week of: ____________</div></header>
<div class="howto"><b>How to use this sheet</b>
  <ul>
    <li>These everyday activities build the steady body, arm and pointer finger used to point to letters.</li>
    <li>Pick a calm time and do 2–3 activities a day. Short and happy beats long and frustrating — stop while it's still going well.</li>
    <li>Check a box each day you practice, and jot notes on what was easy or hard. Bring this sheet to your next session.</li>
  </ul>
</div>
${cards}
<p class="foot">From Word Up · wordups2c.com/at-home</p>
<script>window.onload = () => { window.print() }</script>
</body></html>`)
  w.document.close()
}

export default function HomeActivities() {
  const [group, setGroup] = useState<HomeGroup | 'all'>('all')
  const [picked, setPicked] = useState<string[]>([])
  const [speller, setSpeller] = useState('')
  const shown = HOME_ACTIVITIES.filter(a => group === 'all' || a.group === group)
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-sm border-2 ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`
  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))
  const pickedActs = HOME_ACTIVITIES.filter(a => picked.includes(a.id))

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-gray-900">🏠 At-Home Activities</h2>
        <p className="text-sm text-gray-600">Everyday chores and play that build the same skills. Tick the ones you want, then print a sheet for the family — it has a Mon–Sun row to check off.</p>
      </div>

      <div className="sticky top-0 z-10 bg-white border-2 border-green-300 rounded-2xl p-3 flex items-center gap-3 flex-wrap">
        <input value={speller} onChange={e => setSpeller(e.target.value)} placeholder="Speller's name (optional)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" />
        <button type="button" disabled={!pickedActs.length} onClick={() => printSheet(pickedActs, speller.trim())}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40">🖨️ Print selected ({pickedActs.length})</button>
        <button type="button" onClick={() => printSheet(shown, speller.trim())}
          className="bg-white text-green-700 border-2 border-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50">Print all {group === 'all' ? '' : 'in this group'} ({shown.length})</button>
        {picked.length > 0 && <button type="button" onClick={() => setPicked([])} className="text-sm text-gray-500 underline">Clear</button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button type="button" className={chip(group === 'all')} onClick={() => setGroup('all')}>All</button>
        {HOME_GROUPS.map(g => <button key={g.key} type="button" className={chip(group === g.key)} onClick={() => setGroup(g.key)}>{g.label}</button>)}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {shown.map(a => {
          const on = picked.includes(a.id)
          return (
            <button key={a.id} type="button" onClick={() => toggle(a.id)}
              className={`text-left border-2 rounded-xl p-3 transition-colors ${on ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}`}>
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center text-xs ${on ? 'bg-green-600 border-green-600 text-white' : 'border-gray-400'}`}>{on ? '✓' : ''}</span>
                <div>
                  <p className="font-semibold text-gray-900">{a.emoji} {a.name}</p>
                  <p className="text-xs text-purple-700">{a.builds} · {a.position} · {a.howMuch}</p>
                  <p className="text-xs text-gray-600 mt-1"><b>You&apos;ll need:</b> {a.needs.join(', ')}</p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 mt-1 space-y-0.5">{a.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
                  <p className="text-xs text-gray-600 mt-1">💡 {a.tip}</p>
                  <p className="text-xs text-gray-500 mt-1"><b>Easier:</b> {a.easier} <b>Harder:</b> {a.harder}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

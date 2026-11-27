'use client'

import { useState } from 'react'
import { HOME_ACTIVITIES, HOME_GROUPS, type HomeActivity, type HomeGroup } from '@/lib/homeActivities'

const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

// Opens a clean, printable one-page sheet in a new window: the chosen
// activities with steps, easier/harder, and a Mon–Sun row to tick off.
function printSheet(activities: HomeActivity[], speller: string) {
  const w = window.open('', '_blank')
  if (!w) return
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span class="day"><span class="box"></span>${d}</span>`).join('')
  const cards = activities.map(a => `
    <div class="card">
      <h3>${a.emoji} ${escape(a.name)} <small>${escape(a.position)}</small></h3>
      <p class="builds">Builds: ${escape(a.builds)}</p>
      <ol>${a.steps.map(s => `<li>${escape(s)}</li>`).join('')}</ol>
      <p class="adj"><b>Easier:</b> ${escape(a.easier)} &nbsp; <b>Harder:</b> ${escape(a.harder)}</p>
      <div class="days">${days}</div>
    </div>`).join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Motor Planning at Home</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; } .sub { color: #444; font-size: 13px; margin: 0 0 14px; }
  .card { border: 1.5px solid #bbb; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; break-inside: avoid; }
  h3 { font-size: 16px; margin: 0 0 2px; } h3 small { font-weight: normal; color: #666; font-size: 12px; margin-left: 6px; }
  .builds { font-size: 12px; color: #555; margin: 0 0 4px; } ol { margin: 4px 0 4px 18px; padding: 0; font-size: 14px; }
  .adj { font-size: 12px; margin: 4px 0 6px; } .days { display: flex; gap: 12px; font-size: 12px; }
  .day { display: inline-flex; align-items: center; gap: 4px; } .box { width: 14px; height: 14px; border: 1.5px solid #333; display: inline-block; }
  .foot { font-size: 11px; color: #777; margin-top: 12px; }
</style></head><body>
<h1>Motor Planning at Home${speller ? ` — ${escape(speller)}` : ''}</h1>
<p class="sub">Everyday activities that build the steady body, arm and pointer finger used to point to letters. Do a few each day and check off the days you practiced. Keep it fun — stop before it gets frustrating.</p>
${cards}
<p class="foot">From Word Up · wordups2c.com/motor-planning</p>
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
                  <p className="text-xs text-purple-700">{a.builds} · {a.position}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.steps.join(' ')}</p>
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

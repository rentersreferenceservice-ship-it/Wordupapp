'use client'

function Box() {
  return (
    <span style={{
      display: 'inline-block', width: '13px', height: '13px',
      border: '1.5px solid #000', flexShrink: 0, marginTop: '2px'
    }} />
  )
}

function CB({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '4px' }}>
      <Box />
      <span style={{ fontSize: '10pt', lineHeight: '1.35' }}>{label}</span>
    </div>
  )
}

function CBOther() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '4px' }}>
      <span style={{
        display: 'inline-block', width: '13px', height: '13px',
        border: '1.5px solid #000', flexShrink: 0, verticalAlign: 'middle'
      }} />
      <span style={{ fontSize: '10pt' }}>Other:</span>
      <span style={{ flex: 1, borderBottom: '1px solid #555', display: 'inline-block', minWidth: '70px' }} />
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#ddd', borderTop: '2px solid #222', borderBottom: '2px solid #222',
      padding: '5px 10px', margin: '18px 0 10px',
      fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      {children}
    </div>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 'bold', fontSize: '10pt', margin: '10px 0 5px', textDecoration: 'underline' }}>
      {children}
    </div>
  )
}

function FieldLine({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, borderBottom: '1px solid #555', minHeight: '20px' }} />
    </div>
  )
}

function WriteLines({ n = 3 }: { n?: number }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px solid #777', minHeight: '24px', marginBottom: '7px' }} />
      ))}
    </div>
  )
}

function YNRow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '7px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '10pt', whiteSpace: 'nowrap' }}>□ Yes &nbsp; □ No &nbsp; □ Unclear</span>
    </div>
  )
}

export default function PractitionerSeizureLog() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0.65in 0.75in; size: letter portrait; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1e3a5f', color: 'white',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <a href="/practitioner/tools-assessments" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap' }}>← Back</a>
        <span style={{ fontSize: '13px', flex: 1 }}>S2C Session Neurological Event &amp; Motor Performance Observation Log</span>
        <button
          onClick={() => window.print()}
          style={{ background: 'white', color: '#1e3a5f', border: 'none', padding: '8px 22px', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Print / Save as PDF
        </button>
      </div>
      <div className="no-print" style={{ background: '#eef2ff', padding: '8px 20px', borderBottom: '1px solid #c7d2fe', fontSize: '12px', color: '#444', textAlign: 'center' }}>
        Click <strong>Print / Save as PDF</strong> above, then select <strong>"Save as PDF"</strong> as your printer destination.
      </div>

      {/* Form */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '10pt' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '8pt', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', color: '#555' }}>
            Spelling to Communicate (S2C) &nbsp;|&nbsp; Medical Observation Documentation
          </div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.35' }}>
            S2C Session Neurological Event<br />
            &amp; Motor Performance Observation Log
          </div>
          <div style={{ fontSize: '9pt', marginTop: '8px', fontStyle: 'italic', color: '#333' }}>
            For use by the child's Spelling to Communicate practitioner<br />
            Completed forms may be provided to treating medical professionals for clinical evaluation
          </div>
        </div>

        {/* ── SECTION 1 ── */}
        <Section>Student and Session Information</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            <FieldLine label="Student Name:" />
            <FieldLine label="Date:" />
            <FieldLine label="Practitioner:" />
          </div>
          <div>
            <FieldLine label="Session Start Time:" />
            <FieldLine label="Session End Time:" />
            <FieldLine label="Session Length:" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px', marginTop: '4px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={{ fontSize: '10pt' }}>Video Recorded: &nbsp; □ Yes &nbsp; □ No</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '10pt' }}>Board(s) Used: &nbsp; □ 3 Boards &nbsp; □ 26 Board &nbsp; □ Other:</span>
            <span style={{ display: 'inline-block', width: '90px', borderBottom: '1px solid #555' }} />
          </div>
        </div>

        {/* ── SECTION 2 ── */}
        <Section>Baseline at Start of Session</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            <Sub>Overall Regulation and Body Control</Sub>
            {['Calm / regulated', 'Highly active', 'Frequent impulsive movement', 'Lunging / reaching toward board', 'Frequent stimming', 'Difficulty remaining in position'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
          <div>
            <Sub>Visual Orientation to Board</Sub>
            {['Consistently visually oriented', 'Frequently looks away', 'Frequently looks left', 'Frequently looks right', 'Appears visually oriented but misses target', 'Difficulty shifting gaze between boards'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <Sub>Baseline Spelling and Motor Performance</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            <FieldLine label="Words attempted (before event):" />
            <FieldLine label="Letters attempted:" />
          </div>
          <div>
            <FieldLine label="Accurate letter selections:" />
            <FieldLine label="Approximate accuracy %:" />
          </div>
        </div>

        <Sub>Common Motor Pattern Observed (Pre-Event)</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            {['Accurate direct poke', 'Pokes left of intended letter', 'Pokes right of intended letter', 'Pokes above or below intended letter', 'Lunges toward board after completing word'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Difficulty stopping movement', 'Difficulty initiating movement', 'Multiple attempts before purposeful selection'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 3 ── */}
        <Section>Suspected Neurological Event</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            <FieldLine label="Exact time event began:" />
            <FieldLine label="Exact time event ended:" />
            <FieldLine label="Total duration:" />
          </div>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Activity immediately before event:</div>
            <div style={{ borderBottom: '1px solid #777', minHeight: '22px', marginBottom: '7px' }} />
            <div style={{ borderBottom: '1px solid #777', minHeight: '22px', marginBottom: '7px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600 }}>First observable change:</span>
          <div style={{ borderBottom: '1px solid #777', minHeight: '22px', marginTop: '5px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            <Sub>Gaze and Eyes</Sub>
            {['Fixed gaze / stare', 'Gaze deviated left', 'Gaze deviated right', 'Eyes appeared unfocused', 'Head also turned with gaze', 'No observable blink to visual approach', 'Eyelid fluttering / blinking'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
          <div>
            <Sub>Responsiveness</Sub>
            {['Responded to name', 'Did not respond to name', 'Responded to familiar verbal direction', 'Did not respond to familiar verbal direction', 'Responded to gentle touch', 'Did not respond to gentle touch', 'Purposeful movement continued', 'Purposeful movement stopped', 'Unable to determine'].map(l => <CB key={l} label={l} />)}
          </div>
        </div>

        <Sub>Body and Motor Observations</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            {['Body became still', 'Stiffening', 'Jerking / twitching', 'Repetitive movement', 'Facial movement'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Mouth movement', 'Hand / finger movement', 'Change in breathing', 'Change in skin color', 'No additional observable changes'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Detailed Objective Description of Event:</div>
          <WriteLines n={5} />
        </div>

        {/* ── SECTION 4 ── */}
        <Section>Immediately After Event</Section>

        <FieldLine label="Time until apparent return to baseline:" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            {['Immediate return to previous activity', 'Appeared confused', 'Appeared fatigued', 'Increased activity / dysregulation', 'Decreased activity'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Increased stimming', 'Change in visual orientation', 'Change in motor control'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 5 ── */}
        <Section>Post-Event S2C Motor and Spelling Performance</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            <FieldLine label="Time spelling resumed after event:" />
            <FieldLine label="Words attempted after event:" />
          </div>
          <div>
            <FieldLine label="Letters attempted:" />
            <FieldLine label="Accurate letter selections:" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600, whiteSpace: 'nowrap' }}>Approximate accuracy %:</span>
          <div style={{ borderBottom: '1px solid #555', minHeight: '20px', width: '140px' }} />
        </div>

        <Sub>Compared with Pre-Event Performance</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '12px' }}>
          <div>
            {['No observable change', 'Accuracy improved', 'Accuracy decreased', 'Increased left-sided misses', 'Increased right-sided misses', 'Increased impulsive poking'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Increased lunging', 'Increased difficulty initiating movement', 'Increased difficulty stopping movement', 'Increased visual-orientation difficulty'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <div style={{ border: '1.5px solid #888', padding: '14px', marginBottom: '4px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Known Question Assessment</div>
          <div style={{ fontSize: '10pt', marginBottom: '10px' }}>
            Could the student answer an easy KNOWN question previously demonstrated within his current skill level?
          </div>
          <div style={{ fontSize: '10pt', marginBottom: '12px' }}>□ Yes &nbsp;&nbsp;&nbsp; □ No &nbsp;&nbsp;&nbsp; □ Not Attempted</div>
          <FieldLine label="Question asked:" />
          <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Observed response / performance:</div>
          <div style={{ borderBottom: '1px solid #777', minHeight: '22px', marginBottom: '7px' }} />
          <div style={{ borderBottom: '1px solid #777', minHeight: '22px' }} />
        </div>

        {/* ── SECTION 6 ── */}
        <Section>Session Pattern Summary</Section>

        <FieldLine label="Number of suspected events observed during this session:" />

        <div style={{ marginBottom: '12px', marginTop: '4px' }}>
          <YNRow label="Did events appear associated with a change in spelling accuracy?" />
          <YNRow label="Did events appear associated with a change in motor control?" />
          <YNRow label="Did events appear associated with a change in visual orientation?" />
        </div>

        <FieldLine label="Video timestamp(s) of suspected event(s):" />

        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Additional Objective Observations:</div>
          <WriteLines n={6} />
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '22px', padding: '12px 14px', border: '2px solid #333', fontSize: '9pt' }}>
          <strong>IMPORTANT:</strong> This form documents observable behavior and performance patterns. It is not intended to diagnose or confirm seizure activity. Completed forms and relevant video recordings may be provided to the student&apos;s family and treating medical professionals for clinical evaluation.
        </div>

      </div>
    </>
  )
}

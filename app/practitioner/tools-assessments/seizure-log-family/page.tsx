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

function YNUnsure({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '7px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '10pt', whiteSpace: 'nowrap' }}>□ Yes &nbsp; □ No &nbsp; □ Unsure</span>
    </div>
  )
}

export default function FamilySeizureLog() {
  return (
    <>
      <style>{`
        body { background: white !important; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
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
        <span style={{ fontSize: '13px', flex: 1 }}>Suspected Neurological Event Observation Log — Family / Home Tracking Form</span>
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
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '10pt', background: 'white' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '8pt', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', color: '#555' }}>
            Family / Home Tracking Form &nbsp;|&nbsp; Medical Observation Documentation
          </div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.35' }}>
            Suspected Neurological Event<br />
            Observation Log
          </div>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', marginTop: '6px', letterSpacing: '0.03em' }}>
            Family / Home Tracking Form
          </div>
          <div style={{ fontSize: '9pt', marginTop: '6px', fontStyle: 'italic', color: '#333' }}>
            For use by family members and caregivers &nbsp;|&nbsp; Completed forms may be provided to the child's neurologist
          </div>
        </div>

        {/* ── SECTION 1 ── */}
        <Section>Child and Event Information</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            <FieldLine label="Child's Name:" />
            <FieldLine label="Date:" />
            <FieldLine label="Day of Week:" />
            <FieldLine label="Person Observing Event:" />
          </div>
          <div>
            <FieldLine label="Time Event Started:" />
            <FieldLine label="Time Event Ended:" />
            <FieldLine label="Approximate Duration:" />
          </div>
        </div>

        {/* ── SECTION 2 ── */}
        <Section>What Was Happening Before the Episode?</Section>

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>What was he doing immediately before the episode?</div>
        <WriteLines n={2} />

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '6px', marginTop: '4px' }}>How did he seem before the episode?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            {['Typical / at baseline', 'Very active', 'Calm', 'Tired', 'Upset or dysregulated'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Anxious', 'Excited', 'Ill or not feeling well'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 3 ── */}
        <Section>Possible Factors During the Previous 24 Hours</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            {['Poor or disrupted sleep', 'Unusually tired', 'Illness or fever', 'Increased stress', 'Unusual excitement', 'Change in routine'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Missed or changed medication', 'Dehydration or reduced food intake', 'No unusual factors noticed'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 4 ── */}
        <Section>What Did the Episode Look Like?</Section>

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>What was the FIRST unusual thing you noticed?</div>
        <WriteLines n={2} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginTop: '8px' }}>
          <div>
            <Sub>Eyes and Gaze</Sub>
            {['Staring / appeared to "check out"', 'Eyes looking left', 'Eyes looking right', 'Eyes looking upward', 'Eyes looking downward', 'Eyes fixed in one position', 'Eyes moved unusually', 'Rapid blinking or eyelid movement'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
          <div>
            <Sub>Head and Body Position</Sub>
            {['Head remained straight', 'Head turned left', 'Head turned right', 'Body became still', 'Body became stiff', 'Loss of balance or change in posture'].map(l => <CB key={l} label={l} />)}
          </div>
        </div>

        <Sub>Responsiveness During the Episode</Sub>
        <div style={{ marginBottom: '10px' }}>
          <YNUnsure label="Did he respond to his name?" />
          <YNUnsure label="Did he respond to a familiar verbal direction?" />
          <YNUnsure label="Did he respond to gentle touch?" />
          <YNUnsure label="Did he appear aware of people around him?" />
        </div>

        <Sub>Movements or Other Changes During the Episode</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            {['Facial twitching', 'Eye or eyelid twitching', 'Lip movements', 'Chewing movements', 'Repeated swallowing', 'Hand or finger movements', 'Picking at clothing or objects', 'Jerking or twitching', 'Stiffening'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Movement primarily on left side', 'Movement primarily on right side', 'Change in breathing', 'Change in skin color', 'Drooling', 'Loss of bladder control', 'No unusual movements noticed'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 5 ── */}
        <Section>What Happened Afterward?</Section>

        <Sub>Immediately after the episode:</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            {['Returned immediately to usual activity', 'Seemed confused', 'Seemed tired', 'Wanted to sleep', 'Became more active'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Became upset or dysregulated', 'Seemed unsteady', 'Had difficulty with purposeful movement', 'Seemed different from usual self'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <Sub>How long did it take to return to usual baseline?</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginBottom: '10px' }}>
          <div>
            {['Immediately', 'Less than 1 minute', '1–5 minutes'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['5–15 minutes', '15–30 minutes', 'More than 30 minutes'].map(l => <CB key={l} label={l} />)}
          </div>
        </div>

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Additional observations about recovery:</div>
        <WriteLines n={3} />

        {/* ── SECTION 6 ── */}
        <Section>Video Documentation</Section>

        <div style={{ display: 'flex', gap: '32px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600 }}>Was the episode recorded?</span>
          <span style={{ fontSize: '10pt' }}>□ Yes &nbsp;&nbsp; □ No</span>
        </div>

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '6px' }}>If yes, approximately how much was captured?</div>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {['Beginning', 'Middle', 'End', 'Entire event'].map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box />
              <span style={{ fontSize: '10pt' }}>{l}</span>
            </div>
          ))}
        </div>

        <FieldLine label="Video file name / date for easy reference:" />

        {/* ── SECTION 7 ── */}
        <Section>Pattern Tracking</Section>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '7px' }}>
            <span style={{ fontSize: '10pt', fontWeight: 600 }}>Has a similar episode happened before?</span>
            <span style={{ fontSize: '10pt' }}>□ Yes &nbsp; □ No &nbsp; □ Unsure</span>
          </div>
          <FieldLine label="Approximately how many similar episodes occurred today:" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '7px' }}>
            <span style={{ fontSize: '10pt', fontWeight: 600 }}>Did the episodes look similar each time?</span>
            <span style={{ fontSize: '10pt' }}>□ Yes &nbsp; □ No &nbsp; □ Unsure</span>
          </div>
        </div>

        <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>What appeared to be the same or different between episodes?</div>
        <WriteLines n={3} />

        {/* ── SECTION 8 ── */}
        <Section>Most Important Observation</Section>

        <div style={{ fontSize: '10pt', marginBottom: '8px' }}>
          In your own words, describe exactly what concerned you most about this episode. Include anything not captured above.
        </div>
        <WriteLines n={7} />

        {/* Disclaimer */}
        <div style={{ marginTop: '22px', padding: '12px 14px', border: '2px solid #333', fontSize: '9pt' }}>
          <strong>IMPORTANT:</strong> This form documents observable behavior and caregiver observations. It is not intended to diagnose or confirm seizure activity. Completed forms and relevant video recordings may be shared with the child&apos;s treating neurologist or other medical professionals for clinical evaluation.
        </div>

      </div>
    </>
  )
}

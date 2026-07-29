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

function FieldLine({ label, short }: { label: string; short?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: short ? undefined : 1, width: short ? '100px' : undefined, borderBottom: '1px solid #555', minHeight: '20px' }} />
    </div>
  )
}

function WriteLines({ n = 3, label }: { n?: number; label?: string }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      {label && <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>{label}</div>}
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px solid #777', minHeight: '24px', marginBottom: '7px' }} />
      ))}
    </div>
  )
}

function YNRow({ label, options = ['Yes', 'No', 'Unclear'] }: { label: string; options?: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '7px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '10pt', whiteSpace: 'nowrap' }}>
        {options.map((o, i) => <span key={o}>{i > 0 ? '   ' : ''}□ {o}</span>)}
      </span>
    </div>
  )
}

function CompareRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', marginBottom: '7px' }}>
      <span style={{ fontSize: '10pt', fontWeight: 600, marginRight: '12px', minWidth: '200px' }}>{label}</span>
      <span style={{ fontSize: '10pt' }}>
        {options.map((o, i) => (
          <span key={o} style={{ marginRight: '16px', whiteSpace: 'nowrap' }}>□ {o}</span>
        ))}
      </span>
    </div>
  )
}

const tableRows = [
  'Beginning of Session',
  '15 Minutes',
  '30 Minutes',
  '45 Minutes',
  '60 Minutes',
  '75 Minutes',
  '90 Minutes',
  'End of Session',
]

const thStyle: React.CSSProperties = {
  background: '#cecece',
  border: '1px solid #333',
  padding: '5px 4px',
  fontSize: '8pt',
  fontWeight: 'bold',
  textAlign: 'center',
  verticalAlign: 'bottom',
  lineHeight: '1.2',
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #555',
  padding: '3px 4px',
  minHeight: '32px',
  verticalAlign: 'top',
  fontSize: '9pt',
}

const timeStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 'bold',
  fontSize: '8.5pt',
  whiteSpace: 'nowrap',
}

export default function SessionEnergyLog() {
  return (
    <>
      <style>{`
        body { background: white !important; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.6in 0.7in; size: letter portrait; }
          .page-break { page-break-before: always; break-before: page; margin-top: 0; padding-top: 0; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1e3a5f', color: 'white',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <a href="/practitioner/tools-assessments" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap' }}>← Back</a>
        <span style={{ fontSize: '13px', flex: 1 }}>Letterboard Session Energy, Motor &amp; Performance Pattern Tracking Log</span>
        <button
          onClick={() => window.print()}
          style={{ background: 'white', color: '#1e3a5f', border: 'none', padding: '8px 22px', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Print / Save as PDF
        </button>
      </div>
      <div className="no-print" style={{ background: '#eef2ff', padding: '8px 20px', borderBottom: '1px solid #c7d2fe', fontSize: '12px', color: '#444', textAlign: 'center' }}>
        Click <strong>Print / Save as PDF</strong> above, then select <strong>&ldquo;Save as PDF&rdquo;</strong> as your printer destination. This form prints on 3&ndash;4 pages.
      </div>

      {/* ══════════════════════════════════════════════════
          PAGE 1 — Student Info, Health, Baseline
      ══════════════════════════════════════════════════ */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '10pt', background: 'white' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '8pt', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', color: '#555' }}>
            Letterboard Communication &nbsp;|&nbsp; Clinical Observation Documentation
          </div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.35' }}>
            Letterboard Session Energy, Motor<br />&amp; Performance Pattern Tracking Log
          </div>
          <div style={{ fontSize: '11pt', fontStyle: 'italic', marginTop: '6px', letterSpacing: '0.02em' }}>
            Longitudinal Observation of Performance Across the Session
          </div>
          <div style={{ fontSize: '9pt', marginTop: '8px', color: '#333', fontStyle: 'italic' }}>
            For use by the child&apos;s letterboard communication practitioner<br />
            Completed forms may be shared with treating medical professionals for clinical evaluation
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
            <FieldLine label="Total Session Length:" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px', marginTop: '2px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={{ fontSize: '10pt' }}>Video Recorded: &nbsp; □ Yes &nbsp; □ No</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '10pt' }}>Board(s) Used: &nbsp; □ 3 Boards &nbsp; □ 26 Board &nbsp; □ Other:</span>
            <span style={{ display: 'inline-block', width: '80px', borderBottom: '1px solid #555' }} />
          </div>
        </div>

        {/* ── SECTION 2 ── */}
        <Section>Sleep and Health Information (If Known)</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          <div>
            {['Typical sleep reported', 'Poor or disrupted sleep reported', 'Unusually tired before session', 'Recent illness', 'Recovering from illness'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Change in medication reported', 'Change in routine reported', 'Unusual stress reported', 'Information unavailable'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION 3 ── */}
        <Section>Baseline at Beginning of Session</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
          <div>
            <Sub>Energy / Arousal Level</Sub>
            {['Low energy', 'Appears tired', 'Typical for this student', 'Highly active', 'Extremely active', 'Fluctuating energy level'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
          <div>
            <Sub>Regulation / Body Control</Sub>
            {['Calm and regulated', 'Frequent movement', 'Difficulty remaining in position', 'Impulsive movement', 'Lunging or reaching', 'Frequent stimming', 'Difficulty initiating purposeful movement', 'Difficulty stopping purposeful movement'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
          <div>
            <Sub>Visual Orientation</Sub>
            {['Consistently visually oriented to boards', 'Frequently looks away', 'Frequently looks left', 'Frequently looks right', 'Difficulty shifting gaze between boards', 'Appears visually oriented but misses target'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <Sub>Baseline Spelling and Motor Performance</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '6px' }}>
          <div>
            <FieldLine label="Words attempted:" />
            <FieldLine label="Letters attempted:" />
            <FieldLine label="Accurate letter selections:" />
            <FieldLine label="Approximate accuracy %:" />
          </div>
          <div>
            <FieldLine label="Left-sided misses:" />
            <FieldLine label="Right-sided misses:" />
            <FieldLine label="Above-target misses:" />
            <FieldLine label="Below-target misses:" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            <FieldLine label="Impulsive / premature pokes:" />
          </div>
          <div>
            <FieldLine label="Lunging movements:" />
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>Other motor observations at baseline:</div>
          <div style={{ borderBottom: '1px solid #777', minHeight: '22px', marginBottom: '7px' }} />
          <div style={{ borderBottom: '1px solid #777', minHeight: '22px' }} />
        </div>

      </div>{/* end page 1 content */}

      {/* ══════════════════════════════════════════════════
          PAGE 2 — Performance Tracking Table
      ══════════════════════════════════════════════════ */}
      <div className="page-break" style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '10pt', background: 'white' }}>

        {/* Page 2 header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1.5px solid #000', paddingBottom: '6px', marginBottom: '14px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Letterboard Session Energy, Motor &amp; Performance Pattern Tracking Log
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            Student: <span style={{ display: 'inline-block', width: '160px', borderBottom: '1px solid #555', verticalAlign: 'bottom' }} /> &nbsp; Date: <span style={{ display: 'inline-block', width: '90px', borderBottom: '1px solid #555', verticalAlign: 'bottom' }} />
          </div>
        </div>

        <Section>Performance Across the Session</Section>

        <div style={{ fontSize: '9pt', color: '#444', marginBottom: '10px', fontStyle: 'italic' }}>
          Record quick observations at each interval. Use numbers for counts; use short descriptors (Low / Mod / High / Fluct) for energy and regulation. Mark Y/N for suspected events.
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '10%' }}>Time</th>
                <th style={{ ...thStyle, width: '9%' }}>Energy /<br />Arousal</th>
                <th style={{ ...thStyle, width: '9%' }}>Regulation /<br />Body Control</th>
                <th style={{ ...thStyle, width: '9%' }}>Visual<br />Orientation</th>
                <th style={{ ...thStyle, width: '9%' }}>Spelling<br />Accuracy</th>
                <th style={{ ...thStyle, width: '7%' }}>L-Side<br />Misses</th>
                <th style={{ ...thStyle, width: '7%' }}>R-Side<br />Misses</th>
                <th style={{ ...thStyle, width: '7%' }}>Impulsive<br />Pokes</th>
                <th style={{ ...thStyle, width: '7%' }}>Lunging<br />Moves</th>
                <th style={{ ...thStyle, width: '7%' }}>Suspected<br />Event?</th>
                <th style={{ ...thStyle, width: '19%' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i}>
                  <td style={timeStyle}>{row}</td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}></td>
                </tr>
              ))}
              {/* Other Time row */}
              <tr>
                <td style={{ ...timeStyle, display: 'flex', alignItems: 'baseline', gap: '3px', border: 'none', padding: 0 }}>
                  <span style={{ fontSize: '8.5pt', fontWeight: 'bold', border: '1px solid #555', padding: '3px 4px', display: 'block' }}>
                    Other:<br />
                    <span style={{ display: 'inline-block', width: '56px', borderBottom: '1px solid #333', marginTop: '4px' }} />
                  </span>
                </td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '10px', marginBottom: '14px', padding: '8px 12px', border: '1px solid #aaa', fontSize: '9pt', color: '#444' }}>
          <strong>Quick-reference descriptors:</strong> &nbsp; Energy / Regulation — <em>Low, Mod, High, Fluct (fluctuating)</em> &nbsp;|&nbsp; Visual Orientation — <em>Consistent, Intermittent, Poor</em> &nbsp;|&nbsp; Accuracy — record as % or fraction (e.g., 8/10) &nbsp;|&nbsp; Counts — record as whole numbers &nbsp;|&nbsp; Suspected Event — Y / N / Unsure
        </div>

        {/* ── SECTION: Changes Observed ── */}
        <Section>Changes Observed as Session Progressed</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '8px' }}>
          <div>
            {['No significant change observed', 'Energy appeared to decrease', 'Energy appeared to increase', 'Energy fluctuated significantly', 'Regulation improved', 'Regulation decreased', 'Motor accuracy improved', 'Motor accuracy decreased', 'Visual orientation improved', 'Visual orientation decreased'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Left-sided misses increased', 'Right-sided misses increased', 'Impulsive poking increased', 'Impulsive poking decreased', 'Lunging increased', 'Lunging decreased', 'Student appeared to require increased motor support', 'Student appeared to require increased regulation support'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        {/* ── SECTION: Breaks ── */}
        <Section>Breaks and Recovery</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            <FieldLine label="Time of break:" />
            <FieldLine label="Length of break:" />
          </div>
          <div>
            <FieldLine label="Reason for break:" />
          </div>
        </div>

        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600 }}>Type of break or support provided:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            {['Movement', 'Quiet rest', 'Sensory support'].map(l => <CB key={l} label={l} />)}
          </div>
          <div>
            {['Reduced cognitive demand', 'Hydration', 'Food / snack'].map(l => <CB key={l} label={l} />)}
            <CBOther />
          </div>
        </div>

        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600 }}>After the break, performance:</span>
          &nbsp;&nbsp;
          <span style={{ fontSize: '10pt' }}>□ Improved &nbsp; □ Decreased &nbsp; □ Returned to previous baseline &nbsp; □ No observable change &nbsp; □ Unable to determine</span>
        </div>

        <WriteLines n={3} label="Objective observations following the break:" />

      </div>{/* end page 2 content */}

      {/* ══════════════════════════════════════════════════
          PAGE 3 — Events, End-of-Session, Summary
      ══════════════════════════════════════════════════ */}
      <div className="page-break" style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '10pt', background: 'white' }}>

        {/* Page 3 header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1.5px solid #000', paddingBottom: '6px', marginBottom: '14px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Letterboard Session Energy, Motor &amp; Performance Pattern Tracking Log
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            Student: <span style={{ display: 'inline-block', width: '160px', borderBottom: '1px solid #555', verticalAlign: 'bottom' }} /> &nbsp; Date: <span style={{ display: 'inline-block', width: '90px', borderBottom: '1px solid #555', verticalAlign: 'bottom' }} />
          </div>
        </div>

        {/* ── SECTION: Neurological Events ── */}
        <Section>Possible Relationship to Suspected Neurological Events</Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            <FieldLine label="Number of suspected events during session:" />
          </div>
          <div>
            <FieldLine label="Approximate time(s) of event(s):" />
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <YNRow label="Did energy or performance appear to change BEFORE a suspected event?" />
          <YNRow label="Did energy or performance appear to change AFTER a suspected event?" />
          <YNRow label="Did spelling accuracy appear to change after the event?" />
          <YNRow label="Did visual orientation appear to change after the event?" />
          <YNRow label="Did purposeful motor control appear to change after the event?" />
        </div>

        <WriteLines n={4} label="Objective observations related to suspected events:" />

        {/* ── SECTION: End-of-Session Comparison ── */}
        <Section>End-of-Session Comparison</Section>

        <div style={{ fontSize: '10pt', fontStyle: 'italic', marginBottom: '10px', color: '#444' }}>
          Compared with the beginning of the session:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '10px' }}>
          <div>
            <CompareRow label="Energy:" options={['Higher', 'Lower', 'Approximately the same', 'Fluctuating']} />
            <div style={{ height: '8px' }} />
            <CompareRow label="Regulation:" options={['Improved', 'Decreased', 'Approximately the same', 'Fluctuating']} />
          </div>
          <div>
            <CompareRow label="Spelling Accuracy:" options={['Improved', 'Decreased', 'Approximately the same', 'Unable to determine']} />
            <div style={{ height: '8px' }} />
            <CompareRow label="Purposeful Motor Control:" options={['Improved', 'Decreased', 'Approximately the same', 'Unable to determine']} />
            <div style={{ height: '8px' }} />
            <CompareRow label="Visual Orientation:" options={['Improved', 'Decreased', 'Approximately the same', 'Unable to determine']} />
          </div>
        </div>

        {/* ── SECTION: Pattern Summary ── */}
        <Section>Session Pattern Summary</Section>

        <div style={{ fontSize: '10pt', fontStyle: 'italic', marginBottom: '10px', color: '#444' }}>
          Objectively summarize any patterns observed. Use the prompts below to guide your notes.
        </div>

        <div style={{ marginBottom: '14px' }}>
          {[
            { prompt: 'Were changes gradual or sudden?', lines: 2 },
            { prompt: 'Were changes associated with increasing cognitive or motor demand?', lines: 2 },
            { prompt: 'Were changes observed before or after a suspected neurological event?', lines: 2 },
            { prompt: 'Did performance change following a break or period of reduced demand?', lines: 2 },
            { prompt: 'Were directional motor errors random or consistently biased toward one side?', lines: 2 },
            { prompt: 'Were there any other repeatable or notable patterns?', lines: 3 },
          ].map(({ prompt, lines }) => (
            <div key={prompt} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '5px' }}>{prompt}</div>
              {Array.from({ length: lines }).map((_, i) => (
                <div key={i} style={{ borderBottom: '1px solid #777', minHeight: '24px', marginBottom: '6px' }} />
              ))}
            </div>
          ))}
        </div>

        {/* ── SECTION: Video Documentation ── */}
        <Section>Video Documentation</Section>

        <div style={{ display: 'flex', gap: '32px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={{ fontSize: '10pt', fontWeight: 600 }}>Video recorded:</span>
          <span style={{ fontSize: '10pt' }}>□ Yes &nbsp;&nbsp; □ No</span>
        </div>

        <FieldLine label="Video timestamp(s) of significant changes in performance:" />
        <FieldLine label="Video timestamp(s) of suspected neurological events:" />
        <FieldLine label="Video timestamp(s) showing changes in visual orientation or motor control:" />

        {/* Disclaimer */}
        <div style={{ marginTop: '22px', padding: '12px 14px', border: '2px solid #333', fontSize: '9pt' }}>
          <strong>IMPORTANT:</strong> This form is intended to document observable changes in energy, regulation, visual orientation, purposeful motor control, and spelling performance across a letterboard session. It is not intended to diagnose mitochondrial dysfunction, seizure activity, visual-processing disorders, or any other medical condition. Completed forms and relevant video recordings may be shared with the student&apos;s family and treating medical professionals for clinical evaluation.
        </div>

      </div>
    </>
  )
}

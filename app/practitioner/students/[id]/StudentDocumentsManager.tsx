'use client'

import { useState, useRef } from 'react'
import type { StudentDocument } from '@/lib/practitionerStore'

const FORM_TYPES = [
  'S2C Session Neurological Event & Motor Performance Log',
  'Suspected Neurological Event Log (Family)',
  'S2C Session Energy, Motor & Performance Pattern Log',
  'Other Assessment Form',
  'Other Document',
]

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf')
}

export default function StudentDocumentsManager({
  studentId,
  initialDocs,
}: {
  studentId: string
  initialDocs: StudentDocument[]
}) {
  const [docs, setDocs] = useState<StudentDocument[]>(initialDocs)
  const [showUpload, setShowUpload] = useState(false)
  const [label, setLabel] = useState('')
  const [formType, setFormType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) { setError('Please select a file.'); return }
    if (!label.trim()) { setError('Please add a label so you can find this later.'); return }

    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('studentId', studentId)
      fd.append('label', label.trim())
      if (formType) fd.append('formType', formType)

      const res = await fetch('/api/practitioner/student-documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setDocs(prev => [data.doc as StudentDocument, ...prev])
      setShowUpload(false)
      setLabel('')
      setFormType('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(id)
    try {
      await fetch(`/api/practitioner/student-documents/${id}`, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Assessment Forms &amp; Documents</h2>
          <p className="text-xs text-gray-400 mt-0.5">Upload completed observation forms, scanned assessments, or other documents for this student&apos;s record.</p>
        </div>
        <button
          onClick={() => { setShowUpload(v => !v); setError('') }}
          className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap ml-4"
        >
          {showUpload ? 'Cancel' : '+ Upload Document'}
        </button>
      </div>

      {showUpload && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Neurological Event Log — 2026-07-11"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Form Type (optional)</label>
            <select
              value={formType}
              onChange={e => setFormType(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">— Select type —</option>
              {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600"
            />
            <p className="text-xs text-gray-400 mt-1">Photos (JPG, PNG, HEIC) or scanned PDFs. Max 20 MB.</p>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Save to Student Record'}
          </button>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No documents uploaded yet. Click <strong>+ Upload Document</strong> to attach a completed assessment form or scanned document to this student&apos;s record.
        </p>
      ) : (
        <ul className="space-y-2">
          {docs.map(doc => (
            <li key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              {/* Preview */}
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                {isPdf(doc.fileUrl) ? (
                  <div className="w-12 h-12 rounded-lg border border-gray-200 bg-red-50 flex items-center justify-center text-red-500 text-xl font-bold select-none">
                    PDF
                  </div>
                ) : (
                  <img
                    src={doc.fileUrl}
                    alt={doc.label}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </a>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.label}</p>
                {doc.formType && (
                  <p className="text-xs text-blue-600 mt-0.5 truncate">{doc.formType}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View →
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                >
                  {deleting === doc.id ? '…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

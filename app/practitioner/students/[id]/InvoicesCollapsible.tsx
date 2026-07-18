'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  amount: string
  amount_paid: string | null
  is_paid: boolean
}

export default function InvoicesCollapsible({ invoices, todayStr }: { invoices: Invoice[]; todayStr: string }) {
  const [open, setOpen] = useState(false)

  const unpaidCount = invoices.filter(i => !i.is_paid).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          <span className="text-xs text-gray-400">{invoices.length} total</span>
          {unpaidCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {unpaidCount} unpaid
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="border-t border-gray-100 divide-y divide-gray-50 px-2 pb-2">
          {invoices.map(inv => {
            const amount = parseFloat(inv.amount)
            const paid = parseFloat(inv.amount_paid ?? '0')
            const balance = Math.max(0, amount - paid)
            const overdue = !inv.is_paid && inv.due_date && inv.due_date < todayStr
            const statusLabel = inv.is_paid ? 'Paid' : overdue ? 'Overdue' : paid > 0 ? 'Partial' : 'Unpaid'
            const statusColor = inv.is_paid
              ? 'bg-green-100 text-green-700'
              : overdue
              ? 'bg-red-600 text-white'
              : paid > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-600'
            return (
              <li key={inv.id}>
                <Link href={`/practitioner/invoice/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Invoice #{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.invoice_date + 'T00:00:00').toLocaleDateString()}
                      {inv.due_date ? ` · Due ${new Date(inv.due_date + 'T00:00:00').toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">${balance.toFixed(2)} due</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

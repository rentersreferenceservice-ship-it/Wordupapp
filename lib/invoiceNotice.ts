// Temporary notice about the Aug 2026 switch from Net 30 to due-upon-receipt terms.
// Shows on invoices dated from the change through the end of September 2026, then auto-hides.
const NOTICE_START = '2026-08-03'
const NOTICE_END = '2026-09-30'

export function showDueDateChangeNotice(invoiceDate: string): boolean {
  return invoiceDate >= NOTICE_START && invoiceDate <= NOTICE_END
}

export const DUE_DATE_CHANGE_NOTICE =
  "Please note: our payment terms have changed. Invoices are now due upon receipt, rather than within 30 days."

import type { OrderDiagnosisMap, ProcedureCodeConfig } from '../data/snippetServices'

export type SnippetConfigItemType = 'text-snippet' | 'order-set' | 'procedure-codes' | 'diagnosis-codes'

export interface SnippetEditorDraft {
  updatedAt: number
  view: 'add' | 'edit'
  editingRowId: string | null
  phrase: string
  sections: string[]
  groupNames: string[]
  userAccess: string
  useForEHRScribe: boolean
  macroType: string
  appointmentType: string
  optionalExpanded: boolean
  configItems: Array<{ id: string; type: SnippetConfigItemType }>
  textSnippetData: { html: string; alternateWordDropdowns: unknown[] } | null
  textSnippetContent: string
  manualDiagnosisCodes: string[]
  selectedOrders: string[]
  orderDiagnosisCodes: OrderDiagnosisMap
  procedureCodeConfig: ProcedureCodeConfig[]
}

export const SNIPPET_DRAFT_STORAGE_KEY = 'charge-capture-snippet-editor-draft'

export function loadSnippetDraft(): SnippetEditorDraft | null {
  try {
    const raw = localStorage.getItem(SNIPPET_DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SnippetEditorDraft
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveSnippetDraft(draft: SnippetEditorDraft): void {
  try {
    localStorage.setItem(SNIPPET_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* ignore quota errors */
  }
}

export function clearSnippetDraft(): void {
  try {
    localStorage.removeItem(SNIPPET_DRAFT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

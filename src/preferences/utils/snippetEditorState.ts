import { buildInitialOrderDiagnosisMap } from '../data/orderPreconfig'
import { ORDER_SETS } from '../data/snippetOrders'
import type { OrderDiagnosisMap } from '../data/snippetServices'
import type { TableRow } from '../components/TextSnippetsTable'
import type { SnippetEditorDraft } from './snippetDraft'

export type ConfigItemType = 'text-snippet' | 'order-set' | 'procedure-codes' | 'diagnosis-codes'

export interface ConfigItem {
  id: string
  type: ConfigItemType
}

export function getOrderKeysFromSelections(selectedOrders: string[]): string[] {
  return selectedOrders.flatMap(selection => ORDER_SETS[selection] ?? [selection])
}

export function getInitialOrderDiagnosisCodes(
  row: TableRow | undefined,
  selectedOrders: string[]
): OrderDiagnosisMap {
  if (row?.orderDiagnosisCodes && Object.keys(row.orderDiagnosisCodes).length > 0) {
    return row.orderDiagnosisCodes
  }
  if (selectedOrders.length) {
    return buildInitialOrderDiagnosisMap(getOrderKeysFromSelections(selectedOrders))
  }
  return {}
}

export function getInitialManualDiagnosisCodes(row: TableRow | undefined): string[] {
  if (row?.manualDiagnosisCodes) return row.manualDiagnosisCodes
  if (!row?.diagnosisCodes?.length) return []
  const fromOrders = new Set(Object.values(row.orderDiagnosisCodes ?? {}).flat())
  return row.diagnosisCodes.filter(code => !fromOrders.has(code))
}

export function buildInitialConfigItems(row?: TableRow): ConfigItem[] {
  if (row?.configItemTypes?.length) {
    return row.configItemTypes.map((type, i) => ({ id: `cfg-${type}-${i}`, type }))
  }

  const items: ConfigItem[] = [{ id: 'cfg-ts-0', type: 'text-snippet' }]
  let i = 1
  if (row?.orderSelections?.length) items.push({ id: `cfg-os-${i++}`, type: 'order-set' })
  if (
    row?.procedureCodeConfig?.length ||
    row?.snippetServiceGroups?.length ||
    row?.orderSelections?.length
  ) {
    items.push({ id: `cfg-pc-${i++}`, type: 'procedure-codes' })
  }
  if (
    row?.manualDiagnosisCodes?.length ||
    row?.orderDiagnosisCodes ||
    row?.diagnosisCodes?.length
  ) {
    items.push({ id: `cfg-dc-${i++}`, type: 'diagnosis-codes' })
  }
  return items
}

export function getInitialSections(row: TableRow | undefined): string[] {
  if (row?.section?.trim()) return row.section.split(', ').filter(Boolean)
  return []
}

export function draftMatchesSession(
  draft: SnippetEditorDraft | null | undefined,
  view: 'add' | 'edit',
  editingRowId: string | null
): draft is SnippetEditorDraft {
  if (!draft) return false
  if (draft.view !== view) return false
  if (view === 'edit') return draft.editingRowId === editingRowId
  return draft.editingRowId === null
}

export function buildStateFromRow(row?: TableRow) {
  const selectedOrders = row?.orderSelections ?? []
  return {
    phrase: row?.phrase ?? '',
    sections: getInitialSections(row),
    groupNames: row?.groupName ? row.groupName.split(', ').filter(Boolean) : [],
    userAccess: row?.users ?? '',
    useForEHRScribe: row?.useForEHRScribe ?? true,
    macroType: '',
    appointmentType: row?.appointmentType ?? '',
    optionalExpanded: true,
    configItems: buildInitialConfigItems(row),
    textSnippetData: row?.textSnippetData ?? null,
    textSnippetContent: row?.textSnippetData?.html || row?.procedureDoc || '',
    manualDiagnosisCodes: getInitialManualDiagnosisCodes(row),
    selectedOrders,
    orderDiagnosisCodes: getInitialOrderDiagnosisCodes(row, selectedOrders),
    procedureCodeConfig: row?.procedureCodeConfig ?? [],
  }
}

export function buildStateFromDraft(draft: SnippetEditorDraft) {
  return {
    phrase: draft.phrase,
    sections: draft.sections,
    groupNames: draft.groupNames,
    userAccess: draft.userAccess,
    useForEHRScribe: draft.useForEHRScribe,
    macroType: draft.macroType,
    appointmentType: draft.appointmentType,
    optionalExpanded: draft.optionalExpanded,
    configItems: draft.configItems,
    textSnippetData: draft.textSnippetData,
    textSnippetContent: draft.textSnippetContent,
    manualDiagnosisCodes: draft.manualDiagnosisCodes,
    selectedOrders: draft.selectedOrders,
    orderDiagnosisCodes: draft.orderDiagnosisCodes,
    procedureCodeConfig: draft.procedureCodeConfig,
  }
}

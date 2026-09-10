import { diagnosisToIcd10Options } from '../components/DiagnosisCodesComponent'
import { ORDER_SETS, getOrderDetails } from './snippetOrders'

export interface SnippetServiceRow {
  id: string
  cpt: string
  mods: string[]
  description: string
  icds: string[]
}

export interface SnippetServiceGroup {
  category: string
  rows: SnippetServiceRow[]
}

export interface ProcedureCodeConfig {
  cptCode: string
  description?: string
  modifiers: string[]
  units: string
  icds?: string[]
}

/** Full diagnosis code strings keyed by order name (e.g. "X-Ray Knee"). */
export type OrderDiagnosisMap = Record<string, string[]>

/** Canonical display order for service categories in the visit note / snippet editor. */
export const SERVICE_CATEGORY_ORDER = ['Evaluations', 'Procedures', 'Radiology & Imaging', 'DME']

export function categorizeCpt(cpt: string): string {
  if (cpt.startsWith('99')) return 'Evaluations'
  if (cpt.startsWith('7')) return 'Radiology & Imaging'
  if (cpt.startsWith('L')) return 'DME'
  return 'Procedures'
}

function makeRow(
  cpt: string,
  description: string,
  icds: string[],
  mods: string[],
  idPrefix: string
): SnippetServiceRow {
  return {
    id: `${idPrefix}-${cpt}-${Math.random().toString(36).slice(2, 6)}`,
    cpt,
    mods: mods.length ? mods : ['Mod'],
    description,
    icds: icds.length ? icds : [''],
  }
}

/**
 * Build visit-note service groups from order / order-set selections and/or manually
 * added services (procedureCodeConfig), keyed off diagnosis codes for ICD-10 defaults.
 */
export function buildSnippetServiceGroups(opts: {
  orderSelections?: string[]
  diagnosisCodes?: string[]
  orderDiagnosisCodes?: OrderDiagnosisMap
  procedureCodeConfig?: ProcedureCodeConfig[]
}): SnippetServiceGroup[] {
  const fallbackIcds = opts.diagnosisCodes?.length
    ? diagnosisToIcd10Options(opts.diagnosisCodes)
    : []
  const groupMap = new Map<string, SnippetServiceRow[]>()
  const seenKeys = new Set<string>()

  const addRow = (
    key: string,
    cpt: string,
    description: string,
    icds: string[],
    mods: string[],
    prefix: string
  ) => {
    if (seenKeys.has(key)) return
    seenKeys.add(key)
    const category = categorizeCpt(cpt)
    const row = makeRow(cpt, description, icds, mods, prefix)
    if (!groupMap.has(category)) groupMap.set(category, [])
    groupMap.get(category)!.push(row)
  }

  opts.orderSelections?.forEach(selection => {
    const keys = ORDER_SETS[selection] ?? [selection]
    keys.forEach((orderKey, i) => {
      const details = getOrderDetails(orderKey)
      if (details.cpt === 'CPT Code') return
      const orderIcds = opts.orderDiagnosisCodes?.[orderKey]?.length
        ? diagnosisToIcd10Options(opts.orderDiagnosisCodes[orderKey])
        : fallbackIcds
      addRow(`order:${orderKey}`, details.cpt, details.description, orderIcds.slice(0, 1), ['Mod'], `ord-${i}`)
    })
  })

  opts.procedureCodeConfig?.forEach((c, i) => {
    if (!c.cptCode) return
    const icds = c.icds?.filter(Boolean).length ? c.icds.filter(Boolean) : fallbackIcds
    addRow(
      `manual:${c.cptCode}`,
      c.cptCode,
      c.description || c.cptCode,
      icds,
      c.modifiers?.filter(Boolean) ?? [],
      `svc-${i}`
    )
  })

  return SERVICE_CATEGORY_ORDER
    .filter(cat => groupMap.has(cat))
    .map(cat => ({ category: cat, rows: groupMap.get(cat)! }))
}

/** Merge incoming service groups into existing visit-note groups (dedupe by CPT). */
export function mergeServiceGroups(
  existing: SnippetServiceGroup[],
  incoming: SnippetServiceGroup[]
): SnippetServiceGroup[] {
  const result: SnippetServiceGroup[] = existing.map(g => ({
    category: g.category,
    rows: [...g.rows],
  }))

  incoming.forEach(inGroup => {
    let group = result.find(g => g.category === inGroup.category)
    if (!group) {
      group = { category: inGroup.category, rows: [] }
      result.push(group)
    }
    inGroup.rows.forEach(row => {
      if (!group!.rows.some(r => r.cpt === row.cpt)) {
        group!.rows.push({
          ...row,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        })
      }
    })
  })

  return result
}

export const KNEE_PROCEDURE_CODE_OPTIONS = [
  '99214 - Office/outpatient E/M establish patient',
  '20610 - Arthrocentesis, aspiration and/or injection; major joint (knee)',
  'J7325 - Hylan G-F 20 (Synvisc), per 1 mg',
  '73562 - Radiologic examination, knee; 3 views',
  'L1810 - Knee orthosis, elastic with joints, prefabricated',
]

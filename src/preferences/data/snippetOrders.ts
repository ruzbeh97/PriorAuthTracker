export type SnippetOrderType = 'injection' | 'med' | 'brace'

export interface SnippetOrder {
  name: string
  type: SnippetOrderType
}

interface OrderDetails {
  cpt: string
  description: string
}

export const ORDER_DETAILS: Record<string, OrderDetails> = {
  'Arthrocentesis, aspiration and/or injection; major joint (knee)': {
    cpt: '20610',
    description: 'Arthrocentesis, aspiration and/or injection; major joint (knee)',
  },
  'Hylan G-F 20 (Synvisc), per 1 mg': {
    cpt: 'J7325',
    description: 'Hylan G-F 20 (Synvisc), per 1 mg',
  },
  'Knee Orthosis Brace Order': {
    cpt: 'L1810',
    description: 'Knee orthosis, elastic with joints, prefabricated',
  },
  'DME Brace Order': {
    cpt: 'L1810',
    description: 'DME Brace Order',
  },
  'Inject VISCO': {
    cpt: 'J7325',
    description: 'Hylan G-F 20 (Synvisc), per 1 mg',
  },
  'X-Ray Knee': {
    cpt: '73562',
    description: 'Radiologic examination, knee; 3 views',
  },
  'Post-Op X-Ray Knee': {
    cpt: '73562',
    description: 'Radiologic examination, knee; 3 views',
  },
  'MRI Shoulder': {
    cpt: '73221',
    description: 'MRI, any joint of upper extremity',
  },
  'Physical Therapy Referral': {
    cpt: '97110',
    description: 'Therapeutic exercises',
  },
  'Arthroscopy Knee': {
    cpt: '29881',
    description: 'Arthroscopy, knee, surgical; with meniscectomy',
  },
  'Xray place dist ext thor ao': {
    cpt: '75959',
    description: 'Xray place dist ext thor ao',
  },
  'Xray endovasc thor ao repr': {
    cpt: '75956',
    description: 'Xray endovasc thor ao repr',
  },
  'Complete cbc, automated': {
    cpt: '85027',
    description: 'Complete cbc, automated',
  },
  'Drain/inj joint/bursa w/o us': {
    cpt: '20610',
    description: 'Drain/inj joint/bursa w/o us',
  },
  'Injection, methylprednisolone acetate, 1 mg': {
    cpt: 'J1010',
    description: 'Injection, methylprednisolone acetate, 1 mg',
  },
}

export const INDIVIDUAL_ORDERS = [
  'Inject VISCO',
  'Physical Therapy Referral',
  'MRI Shoulder',
  'X-Ray Knee',
  'DME Brace Order',
  'Knee Orthosis Brace Order',
]

export const ORDER_SETS: Record<string, string[]> = {
  'Knee Assessment Order Set': ['X-Ray Knee'],
  'Knee Arthroscopy Order Set': ['Arthroscopy Knee', 'Post-Op X-Ray Knee'],
  'Right Knee Osteoarthritis Order Set': [
    'Arthrocentesis, aspiration and/or injection; major joint (knee)',
    'Hylan G-F 20 (Synvisc), per 1 mg',
  ],
  'Shoulder Eval Order Set': ['MRI Shoulder', 'Physical Therapy Referral'],
  'Insert Hip Injection orders (Copy)': [
    'Xray place dist ext thor ao',
    'Xray endovasc thor ao repr',
    'Complete cbc, automated',
    'Drain/inj joint/bursa w/o us',
    'Injection, methylprednisolone acetate, 1 mg',
  ],
  'Hip Injection Only': [
    'Drain/inj joint/bursa w/o us',
    'Injection, methylprednisolone acetate, 1 mg',
  ],
}

export function getOrderDetails(orderName: string): OrderDetails {
  return ORDER_DETAILS[orderName] ?? { cpt: 'CPT Code', description: orderName }
}

/**
 * Resolve the ORDER_DETAILS key for a given order description. Most order keys match their
 * description exactly, but a few (e.g. "X-Ray Knee") have a distinct key vs. description text.
 * Falls back to the description itself when no key match is found.
 */
export function findOrderKeyByDescription(description: string): string {
  if (ORDER_DETAILS[description]) return description
  const entry = Object.entries(ORDER_DETAILS).find(([, details]) => details.description === description)
  return entry ? entry[0] : description
}

export type OrderCategory = 'injection' | 'referral' | 'medication' | 'imaging' | 'lab' | 'dme'

/** Classifies an order into one of the detailed order-form categories (Injection, Referral, Medication, Imaging, Lab, DME). */
export function inferOrderCategory(orderKey: string): OrderCategory {
  const details = getOrderDetails(orderKey)
  const lower = details.description.toLowerCase()
  if (
    lower.includes('orthosis') ||
    lower.includes('brace') ||
    lower.includes('dme') ||
    lower.includes('immobilizer') ||
    details.cpt.startsWith('L')
  ) {
    return 'dme'
  }
  if (
    lower.includes('tablet') ||
    lower.includes('capsule') ||
    lower.includes('mg oral')
  ) {
    return 'medication'
  }
  if (
    lower.includes('radiologic') ||
    lower.includes('mri') ||
    lower.includes('x-ray') ||
    lower.includes('ray') ||
    details.cpt.startsWith('7')
  ) {
    return 'imaging'
  }
  if (
    lower.includes('lab') ||
    lower.includes('cbc') ||
    lower.includes('panel') ||
    lower.includes('vitamin') ||
    lower.includes('cortisol') ||
    lower.includes('specimen')
  ) {
    return 'lab'
  }
  if (
    lower.includes('therapy') ||
    lower.includes('referral') ||
    lower.includes('exercises') ||
    details.cpt.startsWith('97')
  ) {
    return 'referral'
  }
  return 'injection'
}

function inferOrderType(_orderKey: string, details: OrderDetails): SnippetOrderType {
  const lower = details.description.toLowerCase()
  if (lower.includes('orthosis') || lower.includes('brace') || lower.includes('dme') || details.cpt.startsWith('L')) {
    return 'brace'
  }
  if (lower.includes('synvisc') || lower.includes('hylan') || lower.includes('visco') || details.cpt.startsWith('J')) {
    return 'med'
  }
  if (lower.includes('mri') || lower.includes('x-ray') || lower.includes('radiologic') || details.cpt.startsWith('7')) {
    return 'injection' // reuse icon bucket for imaging orders in visit note
  }
  if (lower.includes('therapy') || lower.includes('exercises') || details.cpt.startsWith('97')) {
    return 'injection'
  }
  if (lower.includes('injection') || lower.includes('arthrocentesis') || details.cpt === '20610') return 'injection'
  return 'injection'
}

/** Flatten selected order sets / individual orders into visit-note order rows. */
export function expandSelectedOrders(selectedOrders: string[]): SnippetOrder[] {
  const lines: SnippetOrder[] = []
  const seen = new Set<string>()

  selectedOrders.forEach(selection => {
    const keys = ORDER_SETS[selection] ?? [selection]
    keys.forEach(orderKey => {
      const details = getOrderDetails(orderKey)
      if (seen.has(details.description)) return
      seen.add(details.description)
      lines.push({
        name: details.description,
        type: inferOrderType(orderKey, details),
      })
    })
  })

  return lines
}

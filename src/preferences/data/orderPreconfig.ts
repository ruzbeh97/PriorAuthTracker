export interface OrderRecipientPreconfig {
  name: string
  fax: boolean
  email: boolean
  text: boolean
}

export interface OrderPreconfig {
  facility?: string
  dispenseInHouse?: boolean
  sendDate?: string
  units?: string
  ndc?: string
  lotNumber?: string
  dateOfProcedure?: string
  quantity?: string
  refills?: string
  modifiers?: string[]
  expectsResponse?: boolean
  urgent?: boolean
  ruleOut?: string
  resultMedium?: string
  fasting?: boolean
  specimenCollected?: boolean
  sampleType?: string
  collectionDate?: string
  collectionTime?: string
  relatedMedications?: string
  insurance?: string
  sig?: string
  internalNote?: string
  externalNote?: string
  attachment?: string
  includePdf?: boolean
  diagnosisCodes?: string[]
  recipients?: OrderRecipientPreconfig[]
}

const ORDER_PRECONFIG: Record<string, OrderPreconfig> = {
  'X-Ray Knee': {
    facility: 'Facility A',
    sendDate: '2026-07-15',
    expectsResponse: true,
    urgent: false,
    modifiers: ['LT'],
    ruleOut: 'Meniscal tear, osteoarthritis',
    resultMedium: 'Imaging facility mail results',
    attachment: 'Chart Note',
    includePdf: true,
    internalNote: 'Compare to prior imaging if available.',
    diagnosisCodes: [
      'M25.562 - Pain in left knee',
      'M17.12 - Unilateral primary osteoarthritis, left knee',
    ],
    recipients: [{ name: 'Dr. Swarovski', fax: true, email: false, text: false }],
  },
  'Post-Op X-Ray Knee': {
    facility: 'Facility A',
    sendDate: '2026-08-01',
    expectsResponse: true,
    urgent: false,
    modifiers: ['LT'],
    ruleOut: 'Post-operative healing assessment',
    resultMedium: 'Imaging facility mail results',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M17.12 - Unilateral primary osteoarthritis, left knee'],
    recipients: [{ name: 'Referring Provider', fax: true, email: true, text: false }],
  },
  'MRI Shoulder': {
    facility: 'Facility B',
    sendDate: '2026-07-20',
    expectsResponse: true,
    urgent: true,
    modifiers: ['LT'],
    ruleOut: 'Rotator cuff tear, impingement syndrome',
    resultMedium: 'Patient brings CD',
    attachment: 'Referral Letter',
    includePdf: true,
    externalNote: 'Patient claustrophobic — may require open MRI.',
    diagnosisCodes: [
      'M25.512 - Pain in left shoulder',
      'M75.102 - Unspecified rotator cuff tear or rupture of left shoulder',
    ],
    recipients: [{ name: 'Dr. Swarovski', fax: false, email: true, text: false }],
  },
  'Physical Therapy Referral': {
    facility: 'Physical Therapy',
    sendDate: '2026-07-10',
    expectsResponse: false,
    attachment: 'Referral Letter',
    includePdf: false,
    internalNote: 'Patient completed 6 weeks home exercise program with limited improvement.',
    externalNote: 'Evaluate and treat for left shoulder pain. Focus on ROM and strengthening.',
    diagnosisCodes: ['M25.512 - Pain in left shoulder'],
  },
  'Hylan G-F 20 (Synvisc), per 1 mg': {
    facility: 'Facility A',
    sendDate: '2026-07-08',
    units: '1',
    ndc: '0023-9401-01',
    lotNumber: 'LOT48213',
    modifiers: ['LT'],
    dateOfProcedure: '2026-07-08',
    insurance: 'BlueCross BlueShield',
    internalNote: 'Consent obtained. Joint sterilely prepped prior to injection.',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M17.12 - Unilateral primary osteoarthritis, left knee'],
    recipients: [{ name: 'Front Desk', fax: false, email: true, text: false }],
  },
  'Inject VISCO': {
    facility: 'Facility A',
    sendDate: '2026-07-08',
    units: '1',
    ndc: '0023-9401-01',
    lotNumber: 'LOT48213',
    modifiers: ['LT'],
    dateOfProcedure: '2026-07-08',
    insurance: 'BlueCross BlueShield',
    internalNote: 'Consent obtained. Joint sterilely prepped prior to injection.',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M17.12 - Unilateral primary osteoarthritis, left knee'],
    recipients: [{ name: 'Front Desk', fax: false, email: true, text: false }],
  },
  'Arthrocentesis, aspiration and/or injection; major joint (knee)': {
    facility: 'Facility A',
    sendDate: '2026-07-08',
    units: '1',
    ndc: '0023-9401-01',
    lotNumber: 'LOT48213',
    modifiers: ['LT'],
    dateOfProcedure: '2026-07-08',
    insurance: 'BlueCross BlueShield',
    internalNote: 'Consent obtained. Joint sterilely prepped.',
    diagnosisCodes: [
      'M25.562 - Pain in left knee',
      'M17.12 - Unilateral primary osteoarthritis, left knee',
    ],
    recipients: [{ name: 'Front Desk', fax: false, email: true, text: false }],
  },
  'Knee Orthosis Brace Order': {
    facility: 'Pharmacy A',
    dispenseInHouse: true,
    quantity: '1',
    refills: '0',
    modifiers: ['LT'],
    sig: 'Wear during ambulation and weight-bearing activities.',
    attachment: 'Chart Note',
    includePdf: false,
    diagnosisCodes: ['M17.12 - Unilateral primary osteoarthritis, left knee'],
  },
  'DME Brace Order': {
    facility: 'Pharmacy A',
    dispenseInHouse: true,
    quantity: '1',
    refills: '0',
    modifiers: ['LT'],
    sig: 'Wear during ambulation and weight-bearing activities as tolerated.',
    attachment: 'Chart Note',
    includePdf: false,
    diagnosisCodes: ['M17.12 - Unilateral primary osteoarthritis, left knee'],
  },
  'Arthroscopy Knee': {
    facility: 'Facility A',
    sendDate: '2026-07-22',
    units: '1',
    ndc: '0023-9401-01',
    lotNumber: 'LOT51027',
    modifiers: ['LT', '59'],
    dateOfProcedure: '2026-07-22',
    insurance: 'Aetna PPO',
    internalNote: 'Pre-op clearance completed. NPO after midnight.',
    diagnosisCodes: [
      'M23.312 - Derangement of posterior horn of medial meniscus due to old tear or injury, left knee',
    ],
    recipients: [{ name: 'Front Desk', fax: true, email: true, text: false }],
  },
  'Xray place dist ext thor ao': {
    facility: 'Facility A',
    sendDate: '2026-09-09',
    expectsResponse: true,
    urgent: false,
    modifiers: ['RT'],
    ruleOut: 'Endovascular thoracic aortic placement',
    resultMedium: 'Imaging facility mail results',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M25.551 - Pain in right hip'],
    recipients: [{ name: 'Dr. Swarovski', fax: true, email: false, text: false }],
  },
  'Xray endovasc thor ao repr': {
    facility: 'Facility A',
    sendDate: '2026-09-09',
    expectsResponse: true,
    urgent: false,
    modifiers: ['RT'],
    ruleOut: 'Endovascular thoracic aortic repair',
    resultMedium: 'Imaging facility mail results',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M25.551 - Pain in right hip'],
    recipients: [{ name: 'Dr. Swarovski', fax: true, email: false, text: false }],
  },
  'Complete cbc, automated': {
    facility: 'Facility A',
    sendDate: '2026-09-09',
    expectsResponse: true,
    urgent: false,
    fasting: false,
    specimenCollected: false,
    diagnosisCodes: ['M25.551 - Pain in right hip'],
    recipients: [{ name: 'Lab', fax: false, email: true, text: false }],
  },
  'Drain/inj joint/bursa w/o us': {
    facility: 'Facility A',
    sendDate: '2026-09-09',
    units: '1',
    modifiers: ['RT'],
    dateOfProcedure: '2026-09-09',
    insurance: 'BlueCross BlueShield',
    internalNote: 'Hip injection without ultrasound guidance.',
    diagnosisCodes: [
      'M25.551 - Pain in right hip',
      'M16.11 - Unilateral primary osteoarthritis, right hip',
    ],
    recipients: [{ name: 'Front Desk', fax: false, email: true, text: false }],
  },
  'Injection, methylprednisolone acetate, 1 mg': {
    facility: 'Facility A',
    sendDate: '2026-09-09',
    units: '40',
    ndc: '0009-3073-01',
    lotNumber: 'LOT61018',
    modifiers: ['RT'],
    dateOfProcedure: '2026-09-09',
    insurance: 'BlueCross BlueShield',
    internalNote: 'Methylprednisolone acetate 40 mg for intra-articular hip injection.',
    diagnosisCodes: [
      'M25.551 - Pain in right hip',
      'M16.11 - Unilateral primary osteoarthritis, right hip',
    ],
    recipients: [{ name: 'Front Desk', fax: false, email: true, text: false }],
  },
}

const CATEGORY_DEFAULTS: Record<string, OrderPreconfig> = {
  imaging: {
    facility: 'Facility A',
    sendDate: '2026-07-15',
    expectsResponse: true,
    urgent: false,
    modifiers: ['LT'],
    ruleOut: 'Rule out pathology',
    resultMedium: 'Imaging facility mail results',
    attachment: 'Chart Note',
    includePdf: true,
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
  referral: {
    facility: 'Physical Therapy',
    sendDate: '2026-07-10',
    expectsResponse: false,
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
  medication: {
    facility: 'Pharmacy A',
    quantity: '30',
    refills: '0',
    sig: 'Take as directed.',
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
  dme: {
    facility: 'Pharmacy A',
    dispenseInHouse: true,
    quantity: '1',
    refills: '0',
    modifiers: ['LT'],
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
  injection: {
    facility: 'Facility A',
    sendDate: '2026-07-08',
    units: '1',
    ndc: '0023-9401-01',
    lotNumber: 'LOT48213',
    modifiers: ['LT'],
    dateOfProcedure: '2026-07-08',
    insurance: 'BlueCross BlueShield',
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
  lab: {
    facility: 'Facility A',
    sendDate: '2026-07-12',
    expectsResponse: true,
    urgent: false,
    fasting: true,
    specimenCollected: false,
    diagnosisCodes: ['M54.50 - Low back pain, unspecified'],
  },
}

export function getOrderPreconfig(orderKey: string, category?: string): OrderPreconfig {
  const specific = ORDER_PRECONFIG[orderKey]
  if (specific) return specific
  const defaults = category ? CATEGORY_DEFAULTS[category] : undefined
  return defaults ?? CATEGORY_DEFAULTS.injection
}

/** Preconfigured diagnosis codes for all known orders (for initializing shared state). */
export function buildInitialOrderDiagnosisMap(orderKeys: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  orderKeys.forEach(key => {
    const codes = getOrderPreconfig(key).diagnosisCodes
    if (codes?.length) map[key] = codes
  })
  return map
}

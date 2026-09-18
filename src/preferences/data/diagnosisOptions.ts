/** Pure diagnosis-code helpers, kept free of React/CSS imports so data modules can use them. */

export function parseDiagnosisOption(code: string): { icd: string; description: string } {
  const sep = code.indexOf(' - ')
  if (sep > 0) {
    return {
      icd: code.slice(0, sep).trim(),
      description: code.slice(sep + 3).trim(),
    }
  }
  return { icd: code.trim(), description: '' }
}

export function diagnosisToIcd10Options(codes: string[]): string[] {
  return codes.map(code => parseDiagnosisOption(code).icd).filter(Boolean)
}

export function buildIcd10OptionDescriptions(codes: string[]): Record<string, string> {
  const descriptions: Record<string, string> = {}
  codes.forEach(code => {
    const { icd, description } = parseDiagnosisOption(code)
    if (icd) descriptions[icd] = description
  })
  return descriptions
}

export function buildIcd10OptionLabels(codes: string[]): Record<string, string> {
  const labels: Record<string, string> = {}
  codes.forEach(code => {
    const { icd } = parseDiagnosisOption(code)
    if (icd) labels[icd] = code
  })
  return labels
}

export function findDiagnosisByIcd10(icd: string, allOptions: string[]): string | undefined {
  return allOptions.find(opt => {
    const sep = opt.indexOf(' - ')
    const code = sep > 0 ? opt.slice(0, sep).trim() : opt.trim()
    return code === icd
  })
}

export function mergeDiagnosisCodes(orderCodes: string[], manualCodes: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  ;[...orderCodes, ...manualCodes].forEach(code => {
    if (code && !seen.has(code)) {
      seen.add(code)
      merged.push(code)
    }
  })
  return merged
}

export const DIAGNOSIS_CODE_OPTIONS = [
    'M25.561 - Pain in right knee',
    'M25.562 - Pain in left knee',
    'M25.511 - Pain in right shoulder',
    'M25.512 - Pain in left shoulder',
    'M54.5 - Low back pain',
    'M25.571 - Pain in right ankle and joints of right foot',
    'M25.572 - Pain in left ankle and joints of left foot',
    'M25.551 - Pain in right hip',
    'M25.552 - Pain in left hip',
    'M25.531 - Pain in right wrist',
    'M25.532 - Pain in left wrist',
    'M25.521 - Pain in right elbow',
    'M25.522 - Pain in left elbow',
    'M17.11 - Unilateral primary osteoarthritis, right knee',
    'M17.12 - Unilateral primary osteoarthritis, left knee',
    'M17.0 - Bilateral primary osteoarthritis of knee',
    'M16.11 - Unilateral primary osteoarthritis of hip, right hip',
    'M16.12 - Unilateral primary osteoarthritis of hip, left hip',
    'M16.0 - Bilateral primary osteoarthritis of hip',
    'M19.011 - Primary osteoarthritis, right shoulder',
    'M19.012 - Primary osteoarthritis, left shoulder',
    'M19.041 - Primary osteoarthritis, right hand',
    'M19.042 - Primary osteoarthritis, left hand',
    'M19.071 - Primary osteoarthritis, right ankle and foot',
    'M19.072 - Primary osteoarthritis, left ankle and foot',
    'M75.101 - Unspecified rotator cuff tear or rupture of right shoulder',
    'M75.102 - Unspecified rotator cuff tear or rupture of left shoulder',
    'M75.21 - Bicipital tenosynovitis, right shoulder',
    'M75.22 - Bicipital tenosynovitis, left shoulder',
    'M75.31 - Calcific tendinitis of right shoulder',
    'M75.32 - Calcific tendinitis of left shoulder',
    'M75.41 - Impingement syndrome of right shoulder',
    'M75.42 - Impingement syndrome of left shoulder',
    'M75.51 - Bursitis of right shoulder',
    'M75.52 - Bursitis of left shoulder',
    'M23.311 - Derangement of anterior horn of medial meniscus due to old tear or injury, right knee',
    'M23.312 - Derangement of anterior horn of medial meniscus due to old tear or injury, left knee',
    'M23.321 - Derangement of posterior horn of medial meniscus due to old tear or injury, right knee',
    'M23.322 - Derangement of posterior horn of medial meniscus due to old tear or injury, left knee',
    'M23.331 - Derangement of anterior horn of lateral meniscus due to old tear or injury, right knee',
    'M23.332 - Derangement of anterior horn of lateral meniscus due to old tear or injury, left knee',
    'M54.2 - Cervicalgia',
    'M54.31 - Sciatica, right side',
    'M54.32 - Sciatica, left side',
    'M54.40 - Lumbago with sciatica, unspecified side',
    'M54.41 - Lumbago with sciatica, right side',
    'M54.42 - Lumbago with sciatica, left side',
    'M54.50 - Low back pain, unspecified',
    'M54.51 - Vertebrogenic low back pain',
    'M48.061 - Spinal stenosis, cervical region',
    'M48.062 - Spinal stenosis, cervicothoracic region',
    'M48.065 - Spinal stenosis, lumbar region',
    'M48.066 - Spinal stenosis, lumbosacral region',
    'M51.26 - Intervertebral disc disorder with myelopathy, lumbar region',
    'M51.27 - Intervertebral disc disorder with myelopathy, lumbosacral region',
    'M51.36 - Intervertebral disc disorder with radiculopathy, lumbar region',
    'M51.37 - Intervertebral disc disorder with radiculopathy, lumbosacral region',
    'M47.812 - Spondylosis without myelopathy or radiculopathy, cervical region',
    'M47.816 - Spondylosis without myelopathy or radiculopathy, lumbar region',
    'M47.817 - Spondylosis without myelopathy or radiculopathy, lumbosacral region',
    'M47.26 - Other spondylosis with myelopathy, lumbar region',
    'M54.16 - Radiculopathy, cervical region',
    'M54.17 - Radiculopathy, lumbosacral region',
    'M25.361 - Instability, right knee',
    'M25.362 - Instability, left knee',
    'M25.311 - Instability, right shoulder',
    'M25.312 - Instability, left shoulder',
    'M25.351 - Instability, right hip',
    'M25.352 - Instability, left hip',
    'M25.461 - Effusion, right knee',
    'M25.462 - Effusion, left knee',
    'M25.411 - Effusion, right shoulder',
    'M25.412 - Effusion, left shoulder',
    'M25.451 - Effusion, right hip',
    'M25.452 - Effusion, left hip',
    'M24.561 - Contracture, right knee',
    'M24.562 - Contracture, left knee',
    'M24.511 - Contracture, right shoulder',
    'M24.512 - Contracture, left shoulder',
    'M79.601 - Pain in right arm',
    'M79.602 - Pain in left arm',
    'M79.631 - Pain in right forearm',
    'M79.632 - Pain in left forearm',
    'M79.641 - Pain in right hand',
    'M79.642 - Pain in left hand',
    'M79.651 - Pain in right thigh',
    'M79.652 - Pain in left thigh',
    'M79.661 - Pain in right lower leg',
    'M79.662 - Pain in left lower leg',
    'S72.001A - Unspecified fracture of right femoral neck, initial encounter',
    'S72.002A - Unspecified fracture of left femoral neck, initial encounter',
    'S82.001A - Unspecified fracture of right patella, initial encounter',
    'S82.002A - Unspecified fracture of left patella, initial encounter',
    'S42.101A - Unspecified fracture of upper end of right humerus, initial encounter',
    'S42.102A - Unspecified fracture of upper end of left humerus, initial encounter',
    'S52.101A - Unspecified fracture of upper end of right radius, initial encounter',
    'S52.102A - Unspecified fracture of upper end of left radius, initial encounter',
    'M66.261 - Spontaneous rupture of flexor tendons, right lower leg',
    'M66.262 - Spontaneous rupture of flexor tendons, left lower leg',
    'M66.271 - Spontaneous rupture of extensor tendons, right lower leg',
    'M66.272 - Spontaneous rupture of extensor tendons, left lower leg'
]

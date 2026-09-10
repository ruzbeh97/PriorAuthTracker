import type { TableRow } from '../components/TextSnippetsTable'
import { buildSnippetServiceGroups } from './snippetServices'

const DEFAULT_ROWS: TableRow[] = [
    {
      id: '1',
      phrase: 'Knee Exam',
      procedureDoc:
        'Right knee exam reveals tenderness along the medial joint line with a positive Lachman and anterior drawer test, consistent with an ACL injury.',
      users: 'Dr. Swarovski',
      section: 'Objective',
      groupName: 'Physical Exam',
      appointmentType: 'IE - Knee',
      useForEHRScribe: true,
      textSnippetData: {
        html:
          '<span class="alternate-word-dropdown-placeholder" data-dropdown-id="ke-1">Right</span> knee exam reveals tenderness along the <span class="alternate-word-dropdown-placeholder" data-dropdown-id="ke-2">medial</span> joint line with a positive Lachman and anterior drawer test, consistent with <span class="alternate-word-dropdown-placeholder" data-dropdown-id="ke-3">an ACL injury</span>.',
        alternateWordDropdowns: [
          {
            id: 'ke-1',
            words: [
              { id: 'ke-1a', word: 'Right', isDefault: true },
              { id: 'ke-1b', word: 'Left', isDefault: false },
              { id: 'ke-1c', word: 'Bilateral', isDefault: false },
            ],
          },
          {
            id: 'ke-2',
            words: [
              { id: 'ke-2a', word: 'medial', isDefault: true },
              { id: 'ke-2b', word: 'lateral', isDefault: false },
            ],
          },
          {
            id: 'ke-3',
            words: [
              { id: 'ke-3a', word: 'an ACL injury', isDefault: true },
              { id: 'ke-3b', word: 'a meniscus tear', isDefault: false },
              { id: 'ke-3c', word: 'a collateral ligament sprain', isDefault: false },
            ],
          },
        ],
      },
    },
    {
      id: '2',
      phrase: 'ACL Assessment',
      procedureDoc:
        'Patient presents with acute right knee pain and instability following a non-contact pivoting injury, consistent with a complete ACL tear.',
      users: 'Dr. Swarovski',
      section: 'Assessment',
      groupName: 'Assessment',
      appointmentType: 'IE - Knee',
      useForEHRScribe: true,
      textSnippetData: {
        html:
          'Patient presents with <span class="alternate-word-dropdown-placeholder" data-dropdown-id="aa-1">acute</span> <span class="alternate-word-dropdown-placeholder" data-dropdown-id="aa-2">right</span> knee pain and instability following a non-contact pivoting injury, consistent with <span class="alternate-word-dropdown-placeholder" data-dropdown-id="aa-3">a complete ACL tear</span>.',
        alternateWordDropdowns: [
          {
            id: 'aa-1',
            words: [
              { id: 'aa-1a', word: 'acute', isDefault: true },
              { id: 'aa-1b', word: 'chronic', isDefault: false },
            ],
          },
          {
            id: 'aa-2',
            words: [
              { id: 'aa-2a', word: 'right', isDefault: true },
              { id: 'aa-2b', word: 'left', isDefault: false },
              { id: 'aa-2c', word: 'bilateral', isDefault: false },
            ],
          },
          {
            id: 'aa-3',
            words: [
              { id: 'aa-3a', word: 'a complete ACL tear', isDefault: true },
              { id: 'aa-3b', word: 'a partial ACL tear', isDefault: false },
              { id: 'aa-3c', word: 'an ACL sprain', isDefault: false },
            ],
          },
        ],
      },
    },
    {
      id: '3',
      phrase: 'Knee Plan',
      procedureDoc:
        'Recommend MRI of the right knee, RICE protocol, and orthopedic referral for evaluation of possible ACL reconstruction.',
      users: 'Dr. Swarovski',
      section: 'Plan',
      groupName: 'Treatment Plan',
      appointmentType: 'IE - Knee',
      useForEHRScribe: true,
      textSnippetData: {
        html:
          'Recommend <span class="alternate-word-dropdown-placeholder" data-dropdown-id="kp-1">MRI</span> of the <span class="alternate-word-dropdown-placeholder" data-dropdown-id="kp-2">right</span> knee, RICE protocol, and orthopedic referral for evaluation of possible <span class="alternate-word-dropdown-placeholder" data-dropdown-id="kp-3">ACL reconstruction</span>.',
        alternateWordDropdowns: [
          {
            id: 'kp-1',
            words: [
              { id: 'kp-1a', word: 'MRI', isDefault: true },
              { id: 'kp-1b', word: 'X-ray', isDefault: false },
              { id: 'kp-1c', word: 'ultrasound', isDefault: false },
            ],
          },
          {
            id: 'kp-2',
            words: [
              { id: 'kp-2a', word: 'right', isDefault: true },
              { id: 'kp-2b', word: 'left', isDefault: false },
              { id: 'kp-2c', word: 'bilateral', isDefault: false },
            ],
          },
          {
            id: 'kp-3',
            words: [
              { id: 'kp-3a', word: 'ACL reconstruction', isDefault: true },
              { id: 'kp-3b', word: 'arthroscopy', isDefault: false },
              { id: 'kp-3c', word: 'conservative management', isDefault: false },
            ],
          },
        ],
      },
    },
    {
      id: '4',
      phrase: 'Right Knee Osteoarthritis',
      procedureDoc:
        'An intra-articular viscosupplement injection using hylan G-F 20 (Synvisc) 16mg was ordered for symptomatic management of right knee osteoarthritis following inadequate response to conservative therapy. The injection is intended to improve joint lubrication, reduce pain, and enhance functional mobility.',
      users: 'Dr. Swarovski',
      section: 'Plan',
      groupName: 'Treatment Plan',
      appointmentType: 'IE - Knee',
      useForEHRScribe: true,
      diagnosisCodes: ['M25.561 - Pain in right knee'],
      orderSelections: ['Right Knee Osteoarthritis Order Set'],
      snippetOrders: [
        { name: 'Arthrocentesis, aspiration and/or injection; major joint (knee)', type: 'injection' },
        { name: 'Hylan G-F 20 (Synvisc), per 1 mg', type: 'med' },
      ],
      snippetServiceGroups: buildSnippetServiceGroups({
        orderSelections: ['Right Knee Osteoarthritis Order Set'],
        diagnosisCodes: ['M25.561 - Pain in right knee'],
      }),
      textSnippetData: {
        html:
          'An intra-articular viscosupplement injection using hylan G-F 20 <span class="alternate-word-dropdown-placeholder" data-dropdown-id="rko-1">(Synvisc) 16mg</span> was ordered for symptomatic management of <span class="alternate-word-dropdown-placeholder" data-dropdown-id="rko-2">right knee</span> osteoarthritis following inadequate response to conservative therapy. The injection is intended to improve joint lubrication, reduce pain, and enhance functional mobility.',
        alternateWordDropdowns: [
          {
            id: 'rko-1',
            words: [
              { id: 'rko-1a', word: '(Synvisc) 16mg', isDefault: true },
              { id: 'rko-1b', word: 'Synvisc 8mg', isDefault: false },
              { id: 'rko-1c', word: 'Euflexxa 20mg', isDefault: false },
            ],
          },
          {
            id: 'rko-2',
            words: [
              { id: 'rko-2a', word: 'right knee', isDefault: true },
              { id: 'rko-2b', word: 'left knee', isDefault: false },
              { id: 'rko-2c', word: 'bilateral knees', isDefault: false },
            ],
          },
        ],
      },
    },
]

export { DEFAULT_ROWS }

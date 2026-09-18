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
    {
      id: '5',
      phrase: 'Hip Injection w/Order',
      procedureDoc:
        'Ultrasound-guided intra-articular corticosteroid injection of the right hip was performed with methylprednisolone acetate 40 mg for symptomatic management of hip pain after an inadequate response to conservative therapy. Orders for the aspiration/injection and the injectable medication were placed with this visit.',
      users: 'Dr. Swarovski',
      section: 'Plan',
      groupName: 'Treatment Plan',
      appointmentType: 'IE - Hip',
      useForEHRScribe: true,
      configItemTypes: ['text-snippet', 'order-set', 'diagnosis-codes'],
      diagnosisCodes: ['M25.551 - Pain in right hip'],
      orderSelections: ['Hip Injection Only'],
      snippetOrders: [
        { name: 'Drain/inj joint/bursa w/o us', type: 'injection' },
        { name: 'Injection, methylprednisolone acetate, 1 mg', type: 'med' },
      ],
      snippetServiceGroups: buildSnippetServiceGroups({
        orderSelections: ['Hip Injection Only'],
        diagnosisCodes: ['M25.551 - Pain in right hip'],
      }),
      textSnippetData: {
        html:
          '<span class="alternate-word-dropdown-placeholder" data-dropdown-id="hiw-1">Ultrasound-guided</span> intra-articular corticosteroid injection of the <span class="alternate-word-dropdown-placeholder" data-dropdown-id="hiw-2">right hip</span> was performed with methylprednisolone acetate <span class="alternate-word-dropdown-placeholder" data-dropdown-id="hiw-3">40 mg</span> for symptomatic management of hip pain after an inadequate response to conservative therapy. Orders for the aspiration/injection and the injectable medication were placed with this visit.',
        alternateWordDropdowns: [
          {
            id: 'hiw-1',
            words: [
              { id: 'hiw-1a', word: 'Ultrasound-guided', isDefault: true },
              { id: 'hiw-1b', word: 'Fluoroscopically guided', isDefault: false },
              { id: 'hiw-1c', word: 'Landmark-guided', isDefault: false },
            ],
          },
          {
            id: 'hiw-2',
            words: [
              { id: 'hiw-2a', word: 'right hip', isDefault: true },
              { id: 'hiw-2b', word: 'left hip', isDefault: false },
            ],
          },
          {
            id: 'hiw-3',
            words: [
              { id: 'hiw-3a', word: '40 mg', isDefault: true },
              { id: 'hiw-3b', word: '80 mg', isDefault: false },
              { id: 'hiw-3c', word: '20 mg', isDefault: false },
            ],
          },
        ],
      },
    },
    {
      id: '6',
      phrase: 'Hip Injection No Order',
      procedureDoc:
        'Discussed an intra-articular corticosteroid injection of the right hip for ongoing hip pain. The patient elected to defer the injection at this time and will continue activity modification, home exercise, and anti-inflammatories. No orders were placed today; we will reassess at the next visit.',
      users: 'Dr. Swarovski',
      section: 'Plan',
      groupName: 'Treatment Plan',
      appointmentType: 'IE - Hip',
      useForEHRScribe: true,
      configItemTypes: ['text-snippet', 'diagnosis-codes'],
      diagnosisCodes: ['M25.551 - Pain in right hip'],
      orderSelections: [],
      snippetOrders: [],
      snippetServiceGroups: [],
      textSnippetData: {
        html:
          'Discussed an intra-articular corticosteroid injection of the <span class="alternate-word-dropdown-placeholder" data-dropdown-id="hin-1">right hip</span> for ongoing hip pain. The patient elected to <span class="alternate-word-dropdown-placeholder" data-dropdown-id="hin-2">defer the injection at this time</span> and will continue activity modification, home exercise, and anti-inflammatories. No orders were placed today; we will reassess at the next visit.',
        alternateWordDropdowns: [
          {
            id: 'hin-1',
            words: [
              { id: 'hin-1a', word: 'right hip', isDefault: true },
              { id: 'hin-1b', word: 'left hip', isDefault: false },
            ],
          },
          {
            id: 'hin-2',
            words: [
              { id: 'hin-2a', word: 'defer the injection at this time', isDefault: true },
              { id: 'hin-2b', word: 'schedule the injection at a later visit', isDefault: false },
            ],
          },
        ],
      },
    },
]

export { DEFAULT_ROWS }

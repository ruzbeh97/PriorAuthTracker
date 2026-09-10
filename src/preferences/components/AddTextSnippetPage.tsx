import { useState, useCallback, useEffect, useMemo } from 'react'
import TextField from './TextField'
import Dropdown from './Dropdown'
import MultiSelectDropdown from './MultiSelectDropdown'
import Switch from './Switch'
import TextSnippetComponent from './TextSnippetComponent'
import OrderSetComponent from './OrderSetComponent'
import ProcedureCodesComponent from './ProcedureCodesComponent'
import DiagnosisCodesComponent, { DIAGNOSIS_CODE_OPTIONS, mergeDiagnosisCodes } from './DiagnosisCodesComponent'
import { expandSelectedOrders, ORDER_SETS } from '../data/snippetOrders'
import { buildInitialOrderDiagnosisMap } from '../data/orderPreconfig'
import {
  buildSnippetServiceGroups,
  type OrderDiagnosisMap,
  type ProcedureCodeConfig,
} from '../data/snippetServices'
import type { TableRow } from './TextSnippetsTable'
import {
  clearSnippetDraft,
  saveSnippetDraft,
  type SnippetEditorDraft,
} from '../utils/snippetDraft'
import {
  buildStateFromDraft,
  buildStateFromRow,
  draftMatchesSession,
  type ConfigItem,
} from '../utils/snippetEditorState'
import './AddTextSnippetPage.css'

interface AddTextSnippetPageProps {
  onBack: () => void
  onSave: (row: TableRow) => void
  onSaveAndCreateAnother: (row: TableRow) => void
  editingRow?: TableRow
  editingRowId?: string | null
  initialDraft?: SnippetEditorDraft | null
  isPreferencesOpen?: boolean
  onOpenPreferences?: () => void
}

const CONFIG_ORDER: Record<ConfigItem['type'], number> = {
  'text-snippet': 0,
  'order-set': 1,
  'procedure-codes': 2,
  'diagnosis-codes': 3,
}

const SECTIONS = ['Subjective', 'Objective', 'Assessment', 'Plan']
const GROUP_OPTIONS = ['Clinical Note - Knee', 'Clinical Note - Shoulder', 'Clinical Note - Hip', 'Clinical Note - Spine']
const USER_OPTIONS = ['All', 'Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Jones', 'Dr. Garcia', 'Dr. Miller', 'Dr. Davis']
const MACRO_OPTIONS = ['Real-time', 'On-demand', 'Scheduled']
const APPT_OPTIONS = ['IE - Knee', 'IE - Shoulder', 'FU - Knee', 'FU - Shoulder', 'Telehealth']

function resolveInitialEditorState(
  editingRow: TableRow | undefined,
  initialDraft: SnippetEditorDraft | null | undefined,
  editingRowId: string | null | undefined
) {
  const view = editingRowId ? 'edit' : 'add'
  if (draftMatchesSession(initialDraft, view, editingRowId ?? null)) {
    return buildStateFromDraft(initialDraft)
  }
  return buildStateFromRow(editingRow)
}

function AddTextSnippetPage({
  onBack,
  onSave,
  onSaveAndCreateAnother,
  editingRow,
  editingRowId = null,
  initialDraft = null,
  isPreferencesOpen = true,
  onOpenPreferences,
}: AddTextSnippetPageProps) {
  const initial = useMemo(
    () => resolveInitialEditorState(editingRow, initialDraft, editingRowId),
    [editingRow, initialDraft, editingRowId]
  )

  const [phrase, setPhrase] = useState(initial.phrase)
  const [sections, setSections] = useState<string[]>(initial.sections)
  const [groupNames, setGroupNames] = useState<string[]>(initial.groupNames)
  const [userAccess, setUserAccess] = useState(initial.userAccess)
  const [useForEHRScribe, setUseForEHRScribe] = useState(initial.useForEHRScribe)
  const [macroType, setMacroType] = useState(initial.macroType)
  const [appointmentType, setAppointmentType] = useState(initial.appointmentType)
  const [optionalExpanded, setOptionalExpanded] = useState(initial.optionalExpanded)

  const [configItems, setConfigItems] = useState<ConfigItem[]>(initial.configItems)
  const [textSnippetData, setTextSnippetData] = useState<{ html: string; alternateWordDropdowns: any[] } | null>(
    initial.textSnippetData
  )
  const [textSnippetContent, setTextSnippetContent] = useState(initial.textSnippetContent)
  const [manualDiagnosisCodes, setManualDiagnosisCodes] = useState<string[]>(initial.manualDiagnosisCodes)
  const [selectedOrders, setSelectedOrders] = useState<string[]>(initial.selectedOrders)
  const [orderDiagnosisCodes, setOrderDiagnosisCodes] = useState<OrderDiagnosisMap>(initial.orderDiagnosisCodes)
  const [procedureCodeConfig, setProcedureCodeConfig] = useState<ProcedureCodeConfig[]>(initial.procedureCodeConfig)

  const orderDiagnosisList = useMemo(() => {
    const seen = new Set<string>()
    const codes: string[] = []
    Object.values(orderDiagnosisCodes).flat().forEach(code => {
      if (code && !seen.has(code)) {
        seen.add(code)
        codes.push(code)
      }
    })
    return codes
  }, [orderDiagnosisCodes])

  const allDiagnosisCodes = useMemo(
    () => mergeDiagnosisCodes(orderDiagnosisList, manualDiagnosisCodes),
    [orderDiagnosisList, manualDiagnosisCodes]
  )

  const handleProcedureConfigChange = useCallback((config: ProcedureCodeConfig[]) => {
    setProcedureCodeConfig(config)
  }, [])

  const handleOrderDiagnosisChange = useCallback((orderKey: string, codes: string[]) => {
    setOrderDiagnosisCodes(prev => ({ ...prev, [orderKey]: codes }))
  }, [])

  useEffect(() => {
    const orderKeys = selectedOrders.flatMap(selection => ORDER_SETS[selection] ?? [selection])
    const prefilled = buildInitialOrderDiagnosisMap(orderKeys)

    setOrderDiagnosisCodes(prev => {
      let changed = false
      const next = { ...prev }
      orderKeys.forEach(key => {
        if (!next[key]?.length && prefilled[key]?.length) {
          next[key] = prefilled[key]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [selectedOrders])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const draft: SnippetEditorDraft = {
        updatedAt: Date.now(),
        view: editingRowId ? 'edit' : 'add',
        editingRowId,
        phrase,
        sections,
        groupNames,
        userAccess,
        useForEHRScribe,
        macroType,
        appointmentType,
        optionalExpanded,
        configItems,
        textSnippetData,
        textSnippetContent,
        manualDiagnosisCodes,
        selectedOrders,
        orderDiagnosisCodes,
        procedureCodeConfig,
      }
      saveSnippetDraft(draft)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [
    editingRowId,
    phrase,
    sections,
    groupNames,
    userAccess,
    useForEHRScribe,
    macroType,
    appointmentType,
    optionalExpanded,
    configItems,
    textSnippetData,
    textSnippetContent,
    manualDiagnosisCodes,
    selectedOrders,
    orderDiagnosisCodes,
    procedureCodeConfig,
  ])

  const handleAddChip = (type: ConfigItem['type']) => {
    setConfigItems(prev => {
      if (prev.some(i => i.type === type)) return prev
      return [...prev, { id: Date.now().toString(), type }]
    })
  }

  const handleRemoveItem = (id: string) => {
    setConfigItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.type === 'text-snippet') {
        setTextSnippetContent('')
        setTextSnippetData(null)
      }
      if (item?.type === 'diagnosis-codes') {
        setManualDiagnosisCodes([])
      }
      if (item?.type === 'order-set') {
        setSelectedOrders([])
        setOrderDiagnosisCodes({})
      }
      if (item?.type === 'procedure-codes') {
        setProcedureCodeConfig([])
      }
      return prev.filter(i => i.id !== id)
    })
  }

  const handleTextSnippetData = useCallback((data: { html: string; alternateWordDropdowns: any[] }) => {
    setTextSnippetData(data)
    if (data.html) {
      const tmp = document.createElement('div')
      tmp.innerHTML = data.html
      setTextSnippetContent(tmp.innerText || '')
    }
  }, [])

  const buildRow = (): TableRow => {
    const displayText = textSnippetData?.html
      ? (() => {
          const tmp = document.createElement('div')
          tmp.innerHTML = textSnippetData.html
          return tmp.innerText || textSnippetContent
        })()
      : textSnippetContent || editingRow?.procedureDoc || ''

    return {
      id: editingRow?.id ?? Date.now().toString(),
      phrase: phrase || 'Phrase / Trigger',
      procedureDoc: displayText,
      users: userAccess || 'All',
      section: sections.join(', '),
      groupName: groupNames.join(', '),
      appointmentType,
      useForEHRScribe,
      textSnippetData: textSnippetData ?? editingRow?.textSnippetData,
      diagnosisCodes: allDiagnosisCodes.length ? allDiagnosisCodes : undefined,
      manualDiagnosisCodes: manualDiagnosisCodes.length ? manualDiagnosisCodes : undefined,
      orderDiagnosisCodes: Object.keys(orderDiagnosisCodes).length ? orderDiagnosisCodes : undefined,
      configItemTypes: configItems.map(i => i.type),
      orderSelections: selectedOrders.length ? selectedOrders : undefined,
      // An empty selection is authoritative: clearing the orders here must also clear
      // what the visit note inserts, so no stale values are carried over from editingRow.
      snippetOrders: selectedOrders.length ? expandSelectedOrders(selectedOrders) : undefined,
      procedureCodeConfig: procedureCodeConfig.length ? procedureCodeConfig : undefined,
      snippetServiceGroups:
        selectedOrders.length || procedureCodeConfig.length
          ? buildSnippetServiceGroups({
              orderSelections: selectedOrders,
              diagnosisCodes: allDiagnosisCodes,
              orderDiagnosisCodes,
              procedureCodeConfig,
            })
          : undefined,
    }
  }

  const handleSave = () => {
    clearSnippetDraft()
    onSave(buildRow())
  }

  const handleSaveAndCreateAnother = () => {
    clearSnippetDraft()
    onSaveAndCreateAnother(buildRow())
  }

  const snippetInitialContent = textSnippetData?.html || textSnippetContent || editingRow?.procedureDoc
  const snippetInitialData =
    textSnippetData ??
    editingRow?.textSnippetData ??
    (editingRow?.procedureDoc ? { html: editingRow.procedureDoc, alternateWordDropdowns: [] } : undefined)

  return (
    <div className="add-snippet-page">
      {/* Header */}
      <div className="add-snippet-header">
        <div className="add-snippet-header-left">
          {!isPreferencesOpen && onOpenPreferences && (
            <button
              className="open-preferences-btn"
              aria-label="Open Preferences"
              onClick={onOpenPreferences}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="4" fill="#F3F4F6"/>
                <path d="M8 6L12 10L8 14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button className="back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Text Snippets
          </button>
        </div>
        <div className="add-snippet-header-actions">
          <button className="save-create-another-btn" onClick={handleSaveAndCreateAnother}>
            Save &amp; Create Another
          </button>
          <button className="save-snippet-btn" onClick={handleSave}>
            Save Text Snippet
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="add-snippet-body">

        {/* Phrase + Section row */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Phrase / Trigger Word</label>
            <TextField
              placeholder="Add Phrase / Trigger"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Available Sections of Visit Note</label>
            <MultiSelectDropdown
              placeholder="Select a Section"
              selectedValues={sections}
              onChange={setSections}
              options={SECTIONS}
            />
          </div>
        </div>

        {/* Configuration section: gray box + add-object chips grouped together */}
        <div className="config-section">
          <div className="config-area">
            {configItems.length === 0 ? (
              <div className="config-placeholder">
                <span className="config-placeholder-text">Add one of the objects below to build your text snippet</span>
              </div>
            ) : (
              <div className="config-items">
                {[...configItems].sort((a, b) => CONFIG_ORDER[a.type] - CONFIG_ORDER[b.type]).map(item => (
                  <div key={item.id} className="config-item-wrapper">
                    {item.type === 'text-snippet' && (
                      <TextSnippetComponent
                        key={`ts-${item.id}`}
                        onRemove={() => handleRemoveItem(item.id)}
                        onContentChange={setTextSnippetContent}
                        onDataChange={handleTextSnippetData}
                        initialContent={snippetInitialContent}
                        initialData={snippetInitialData}
                      />
                    )}
                    {item.type === 'order-set' && (
                      <OrderSetComponent
                        onRemove={() => handleRemoveItem(item.id)}
                        allDiagnosisOptions={DIAGNOSIS_CODE_OPTIONS}
                        selectedOrders={selectedOrders}
                        onSelectedOrdersChange={setSelectedOrders}
                        orderDiagnosisCodes={orderDiagnosisCodes}
                        onOrderDiagnosisChange={handleOrderDiagnosisChange}
                      />
                    )}
                    {item.type === 'procedure-codes' && (
                      <ProcedureCodesComponent
                        onRemove={() => handleRemoveItem(item.id)}
                        config={procedureCodeConfig}
                        onConfigChange={handleProcedureConfigChange}
                        selectedOrders={selectedOrders}
                        diagnosisCodes={allDiagnosisCodes}
                        orderDiagnosisCodes={orderDiagnosisCodes}
                      />
                    )}
                    {item.type === 'diagnosis-codes' && (
                      <DiagnosisCodesComponent
                        onRemove={() => handleRemoveItem(item.id)}
                        orderDiagnosisCodes={orderDiagnosisList}
                        selectedValues={manualDiagnosisCodes}
                        onChange={setManualDiagnosisCodes}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add-object chips — sit just below the gray box, outside of it */}
          <div className="add-object-chips">
            <button
              className="add-chip"
              onClick={() => handleAddChip('order-set')}
              disabled={configItems.some(i => i.type === 'order-set')}
            >
              <span className="add-chip-plus">+</span> Order / Order Set
            </button>
            <button
              className="add-chip"
              onClick={() => handleAddChip('procedure-codes')}
              disabled={configItems.some(i => i.type === 'procedure-codes')}
            >
              <span className="add-chip-plus">+</span> Services
            </button>
            <button
              className="add-chip"
              onClick={() => handleAddChip('diagnosis-codes')}
              disabled={configItems.some(i => i.type === 'diagnosis-codes')}
            >
              <span className="add-chip-plus">+</span> Diagnosis
            </button>
          </div>
        </div>

        <div className="section-divider" />

        {/* Optional Features */}
        <div className="optional-section">
          <button className="optional-header" onClick={() => setOptionalExpanded(p => !p)}>
            <span className="optional-title">Optional Features</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`optional-chevron ${optionalExpanded ? 'expanded' : ''}`}
            >
              <path d="M4 6L8 10L12 6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {optionalExpanded && (
            <div className="optional-content">
              {/* Category & Access */}
              <div className="optional-subsection-chip">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1" stroke="#374151" strokeWidth="1.3"/>
                  <rect x="9" y="2" width="5" height="5" rx="1" stroke="#374151" strokeWidth="1.3"/>
                  <rect x="2" y="9" width="5" height="5" rx="1" stroke="#374151" strokeWidth="1.3"/>
                  <rect x="9" y="9" width="5" height="5" rx="1" stroke="#374151" strokeWidth="1.3"/>
                </svg>
                Category &amp; Access
              </div>

              <div className="optional-field-row">
                <span className="optional-field-label">What group would you like this to be a part of?</span>
                <div className="optional-field-input">
                  <MultiSelectDropdown
                    placeholder="Group Name"
                    selectedValues={groupNames}
                    onChange={setGroupNames}
                    options={GROUP_OPTIONS}
                    allowCustom
                    searchPlaceholder="Search or add group name..."
                  />
                </div>
                <button className="info-btn" aria-label="Info">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                    <path d="M8 7V11M8 5.5V5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="optional-field-row">
                <span className="optional-field-label">Which users should have access to this?</span>
                <div className="optional-field-input">
                  <Dropdown
                    placeholder="User Access"
                    value={userAccess}
                    onChange={setUserAccess}
                    options={USER_OPTIONS}
                  />
                </div>
                <button className="info-btn" aria-label="Info">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                    <path d="M8 7V11M8 5.5V5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Scribe functionality */}
              <div className="optional-subsection-chip">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2C8 2 5 5 5 8.5C5 10.433 6.343 12 8 12C9.657 12 11 10.433 11 8.5C11 5 8 2 8 2Z" stroke="#374151" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M6 14H10" stroke="#374151" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Scribe functionality
              </div>

              <div className="optional-field-row">
                <span className="optional-field-label">Enable this snippet for EHR Scribe</span>
                <div className="optional-field-toggle">
                  <Switch checked={useForEHRScribe} onChange={setUseForEHRScribe} />
                </div>
                <button className="info-btn" aria-label="Info">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                    <path d="M8 7V11M8 5.5V5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="optional-field-row">
                <span className="optional-field-label">How should this be used with Scribe?</span>
                <div className="optional-field-input">
                  <Dropdown
                    placeholder="Select Macro Type"
                    value={macroType}
                    onChange={setMacroType}
                    options={MACRO_OPTIONS}
                  />
                </div>
                <button className="info-btn" aria-label="Info">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                    <path d="M8 7V11M8 5.5V5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="optional-field-row">
                <span className="optional-field-label">What appointment types should this appear in?</span>
                <div className="optional-field-input">
                  <Dropdown
                    placeholder="Select Appointment Types"
                    value={appointmentType}
                    onChange={setAppointmentType}
                    options={APPT_OPTIONS}
                  />
                </div>
                <button className="info-btn" aria-label="Info">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                    <path d="M8 7V11M8 5.5V5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default AddTextSnippetPage

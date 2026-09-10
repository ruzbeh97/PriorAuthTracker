import { useState, useEffect, useMemo, useRef } from 'react'
import SearchableDropdown from './SearchableDropdown'
import Dropdown from './Dropdown'
import { ORDER_SETS, INDIVIDUAL_ORDERS, getOrderDetails, inferOrderCategory, type OrderCategory } from '../data/snippetOrders'
import { getOrderPreconfig } from '../data/orderPreconfig'
import type { OrderDiagnosisMap } from '../data/snippetServices'
import './OrderSetComponent.css'

interface OrderSetComponentProps {
  onRemove?: () => void
  allDiagnosisOptions?: string[]
  onDiagnosisCodeAdd?: (fullCode: string) => void
  selectedOrders?: string[]
  onSelectedOrdersChange?: (orders: string[]) => void
  orderDiagnosisCodes?: OrderDiagnosisMap
  onOrderDiagnosisChange?: (orderKey: string, codes: string[]) => void
}

const MOD_OPTIONS = ['LT', 'RT', '50', '59', 'XS']

function MinusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 10H15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="#6B7280" strokeWidth="1.5" />
      <path d="M10 6.5V13.5M6.5 10H13.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 1.2L8.665 4.62L12.44 5.17L9.72 7.82L10.36 11.58L7 9.81L3.64 11.58L4.28 7.82L1.56 5.17L5.335 4.62L7 1.2Z"
        fill={filled ? '#F5A623' : 'none'}
        stroke={filled ? '#F5A623' : '#9CA3AF'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function buildOrderSetSubtitle(setName: string): string {
  const keys = ORDER_SETS[setName] ?? []
  return keys.map(k => getOrderDetails(k).description).join(', ')
}

type BrowserTab = 'all' | 'favorites' | 'order-sets' | 'individual'

export function AddOrderMenu({
  options,
  selectedOrders,
  onToggle,
  triggerLabel = 'Add Order',
  triggerClassName = 'order-set-add-button',
}: {
  options: string[]
  selectedOrders: string[]
  onToggle: (option: string) => void
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<BrowserTab>('all')
  const [search, setSearch] = useState('')
  const [favoriteOrderSets, setFavoriteOrderSets] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const orderSetNames = options.filter(o => o in ORDER_SETS)
  const individualNames = options.filter(o => !(o in ORDER_SETS))

  const searchLower = search.trim().toLowerCase()
  const matchesSearch = (name: string) => name.toLowerCase().includes(searchLower)

  const showOrderSets = activeTab !== 'individual'
  const showIndividual = activeTab !== 'order-sets' && activeTab !== 'favorites'

  let visibleOrderSets = showOrderSets ? orderSetNames.filter(matchesSearch) : []
  if (activeTab === 'favorites') {
    visibleOrderSets = visibleOrderSets.filter(name => favoriteOrderSets.includes(name))
  }
  const visibleIndividual = showIndividual ? individualNames.filter(matchesSearch) : []
  const isEmpty = visibleOrderSets.length === 0 && visibleIndividual.length === 0

  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoriteOrderSets(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  return (
    <div className="order-set-add-wrapper" ref={ref}>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setIsOpen(o => !o)}
      >
        {triggerLabel}
      </button>
      {isOpen && (
        <div className="order-set-browser">
          <div className="order-set-browser-nav">
            <button
              type="button"
              className={`order-set-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`order-set-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites
            </button>
            <button
              type="button"
              className={`order-set-nav-tab ${activeTab === 'order-sets' ? 'active' : ''}`}
              onClick={() => setActiveTab('order-sets')}
            >
              Order Sets
            </button>
            <button
              type="button"
              className={`order-set-nav-tab ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              Individual Order
            </button>
          </div>
          <div className="order-set-browser-main">
            <div className="order-set-browser-search">
              <input
                type="text"
                autoFocus
                className="order-set-browser-search-input"
                placeholder="Search Order / Order Set"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="order-set-browser-list">
              {visibleOrderSets.length > 0 && (
                <>
                  <div className="order-set-browser-section-header order-set-browser-section-header-blue">
                    Orders Sets
                  </div>
                  {visibleOrderSets.map(name => {
                    const checked = selectedOrders.includes(name)
                    const favorited = favoriteOrderSets.includes(name)
                    return (
                      <div
                        key={name}
                        className={`order-set-browser-row ${checked ? 'selected' : ''}`}
                        onClick={() => onToggle(name)}
                      >
                        <div className="order-set-browser-row-main">
                          <div className="order-set-browser-row-top">
                            <span className="order-set-browser-row-title">{name}</span>
                            <button
                              type="button"
                              className={`order-set-browser-star ${favorited ? 'favorited' : ''}`}
                              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                              onClick={e => toggleFavorite(name, e)}
                            >
                              <StarIcon filled={favorited} />
                            </button>
                          </div>
                          <span className="order-set-browser-row-subtitle">{buildOrderSetSubtitle(name)}</span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
              {visibleIndividual.length > 0 && (
                <>
                  <div className="order-set-browser-section-header order-set-browser-section-header-yellow">
                    Individual Orders
                  </div>
                  {visibleIndividual.map(name => {
                    const checked = selectedOrders.includes(name)
                    const { cpt } = getOrderDetails(name)
                    return (
                      <div
                        key={name}
                        className={`order-set-browser-row ${checked ? 'selected' : ''}`}
                        onClick={() => onToggle(name)}
                      >
                        <div className="order-set-browser-row-main">
                          <span className="order-set-browser-row-title">{name}</span>
                          {cpt !== 'CPT Code' && <span className="order-set-browser-row-subtitle">{cpt}</span>}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
              {isEmpty && <div className="order-set-browser-empty">No matching orders found</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 13.8167 7.15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.3 7.15H3.56667C2.55556 7.15 1.70833 6.80833 1.025 6.125C0.341667 5.44167 0 4.59444 0 3.58333C0 2.57222 0.341667 1.72222 1.025 1.03333C1.70833 0.344445 2.55556 0 3.56667 0H6.3V1.33333H3.56667C2.92222 1.33333 2.38611 1.54722 1.95833 1.975C1.53056 2.40278 1.31667 2.93889 1.31667 3.58333C1.31667 4.22778 1.53056 4.76389 1.95833 5.19167C2.38611 5.61944 2.92222 5.83333 3.56667 5.83333H6.3V7.15ZM4.15 4.13333V3.03333H9.65V4.13333H4.15ZM7.5 7.15V5.83333H10.2333C10.8778 5.83333 11.4139 5.61944 11.8417 5.19167C12.2694 4.76389 12.4833 4.22778 12.4833 3.58333C12.4833 2.93889 12.2694 2.40278 11.8417 1.975C11.4139 1.54722 10.8778 1.33333 10.2333 1.33333H7.5V0H10.2333C11.2444 0 12.0944 0.344445 12.7833 1.03333C13.4722 1.72222 13.8167 2.57222 13.8167 3.58333C13.8167 4.59444 13.4722 5.44167 12.7833 6.125C12.0944 6.80833 11.2444 7.15 10.2333 7.15H7.5Z"
        fill="#1A1A1A"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 5H17.5M15.8333 5V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H5C4.53976 17.5 4.16667 17.1269 4.16667 16.6667V5M6.66667 5V3.33333C6.66667 2.8731 7.03976 2.5 7.5 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V5"
        stroke="#6B7280"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function OrderRowIcon({ category }: { category: OrderCategory }) {
  if (category === 'medication') {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="7" width="13" height="4" rx="2" transform="rotate(-45 2.5 7)" stroke="#B45309" strokeWidth="1.4" />
        <path d="M7 5L11 9" stroke="#B45309" strokeWidth="1.4" />
      </svg>
    )
  }
  if (category === 'dme') {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="#B45309" strokeWidth="1.4" />
        <path d="M9 5.5V9L11 11" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (category === 'imaging') {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="3" width="12" height="12" rx="2" stroke="#2563EB" strokeWidth="1.4" />
        <path d="M3 9H15M9 3V15" stroke="#2563EB" strokeWidth="1.2" />
      </svg>
    )
  }
  if (category === 'lab') {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M7 2H11M7.5 2V6.5L3.8 13.2C3.4 13.9 3.9 14.8 4.7 14.8H13.3C14.1 14.8 14.6 13.9 14.2 13.2L10.5 6.5V2" stroke="#059669" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M5.2 11H12.8" stroke="#059669" strokeWidth="1.2" />
      </svg>
    )
  }
  if (category === 'referral') {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="6.5" cy="5.5" r="2.2" stroke="#7C3AED" strokeWidth="1.3" />
        <path d="M2.5 15C2.5 12 4.3 10.3 6.5 10.3C8.7 10.3 10.5 12 10.5 15" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="12.5" cy="6" r="1.8" stroke="#7C3AED" strokeWidth="1.2" />
        <path d="M10.3 15C10.3 12.5 11.5 11.2 12.9 11.2C14.7 11.2 15.7 12.7 15.7 15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M11 2L16 7L9 14H4V9L11 2Z" stroke="#B45309" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Shared demo option lists for the detailed order form fields ── */
const FACILITY_OPTIONS = ['Facility A', 'Facility B']
const PHARMACY_OPTIONS = ['Pharmacy A', 'Pharmacy B']
const PROVIDER_OPTIONS = ['Physical Therapy', 'Orthopedic Surgery', 'Pain Management']
const ATTACHMENT_OPTIONS = ['Chart Note', 'Lab Result', 'Imaging Report', 'Referral Letter']
const RECIPIENT_OPTIONS = ['Dr. Swarovski', 'Front Desk', 'Referring Provider', 'Patient']
const CPT_OPTIONS = [
  '75959 - Xray place dist ext thor ao',
  '75956 - Xray endovasc thor ao repr',
  '85027 - Complete cbc, automated',
]
const PRIORITY_OPTIONS = ['No Priority', 'Routine', 'Urgent', 'STAT']
const PROCEDURE_OPTIONS = [
  'J1010 - Injection, methylprednisolone acetate, 1 mg',
  '20610 - Drain/inj joint/bursa w/o us',
]
const PROCEDURE_UNIT_OPTIONS = ['Unit', 'mg', 'mL', 'units']
const PROCEDURE_ROUTE_OPTIONS = ['IM', 'IV', 'PO', 'Intra-articular']
const PROCEDURE_MODIFIER_OPTIONS = ['50', 'LT', 'RT', '59']
const PROCEDURE_ICD10_OPTIONS = ['M25.561', 'M25.551', 'M25.552', 'S83.511A']
const ASSIGNEE_OPTIONS = [
  'Ashton Roy',
  'Bailey Moon',
  'Brad Hope',
  'Leo Wood',
  'Olivia Grace',
  'Ethan Sky',
  'Sophia Sun',
  'Noah Rain',
  'Isabella Star',
  'Caleb Stone',
  'Ava Brooks',
  'Ryan Field',
  'Hazel Cloud',
  'Dylan River',
  'Piper West',
  'Gavin Lake',
  'Violet Ash',
]
const SAVED_SIG_OPTIONS = [
  'Take 1 tablet by mouth every 6 hours as needed for pain.',
  'Take 1 tablet by mouth twice daily with food.',
  'Apply as directed to affected area.',
]
const DEMO_ADDRESS = '1900 W Memorial, Oklahoma City, OK 73134, Ph (405) 748-6521, Fax (405) 748-3006'

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path
        d="M5.5 13.5H12.5C14 13.5 15 12.3 15 11C15 9.7 14 8.6 12.7 8.5C12.5 6.4 10.8 4.8 8.7 4.8C6.9 4.8 5.4 6 4.9 7.6C3.3 7.8 2 9.2 2 10.8C2 12.4 3.3 13.5 4.7 13.5"
        stroke="#9CA3AF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckmarkIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 10L8 6L12 10" stroke="#666666" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DetailField({
  label,
  children,
  align = 'center',
}: {
  label: string
  children: React.ReactNode
  align?: 'center' | 'start'
}) {
  return (
    <div className={`odf-row ${align === 'start' ? 'odf-row-start' : ''}`}>
      <span className="odf-label">{label}</span>
      <div className="odf-content">{children}</div>
    </div>
  )
}

function DetailDivider({ label }: { label: string }) {
  return (
    <div className="odf-divider">
      <span className="odf-divider-label">{label}</span>
    </div>
  )
}

function DetailAddress() {
  return <div className="odf-address">{DEMO_ADDRESS}</div>
}

function DetailCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <div className="odf-checkbox-wrap">
      <button
        type="button"
        className={`odf-checkbox ${checked ? 'checked' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        aria-pressed={checked}
        disabled={disabled}
      >
        {checked && <CheckmarkIcon />}
      </button>
      {label && (
        <span className="odf-checkbox-label" onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      )}
    </div>
  )
}

function ModifiersField({
  values,
  onChange,
  disabled = false,
}: {
  values: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const addMod = () => onChange([...values, ''])
  const removeMod = (i: number) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : values)
  const setMod = (i: number, v: string) => onChange(values.map((m, idx) => (idx === i ? v : m)))
  return (
    <div className="odf-modifiers">
      {values.map((v, i) => (
        <div className="odf-modifier-row" key={i}>
          <div className="odf-modifier-dropdown">
            <Dropdown
              placeholder="Mod"
              value={v}
              onChange={val => setMod(i, val)}
              options={MOD_OPTIONS}
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <>
              <button
                type="button"
                className="obr-action"
                aria-label="Remove modifier"
                onClick={() => removeMod(i)}
                disabled={values.length <= 1}
              >
                <MinusIcon />
              </button>
              {i === values.length - 1 && (
                <button type="button" className="obr-action" aria-label="Add modifier" onClick={addMod}>
                  <PlusIcon />
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function NotesField({
  internalNote = '',
  externalNote = '',
  disabled = false,
}: {
  internalNote?: string
  externalNote?: string
  disabled?: boolean
}) {
  const [internalOpen, setInternalOpen] = useState(Boolean(internalNote))
  const [externalOpen, setExternalOpen] = useState(Boolean(externalNote))
  const [internalText, setInternalText] = useState(internalNote)
  const [externalText, setExternalText] = useState(externalNote)

  if (disabled) {
    return (
      <DetailField label="Note" align="start">
        <div className="odf-notes">
          {internalNote ? (
            <textarea className="odf-notes-textarea" value={internalNote} readOnly disabled />
          ) : null}
          {externalNote ? (
            <textarea className="odf-notes-textarea" value={externalNote} readOnly disabled />
          ) : null}
        </div>
      </DetailField>
    )
  }

  return (
    <DetailField label="Note" align="start">
      <div className="odf-notes">
        <div className="odf-notes-buttons">
          <button
            type="button"
            className={`odf-pill-btn ${internalOpen ? 'active' : ''}`}
            onClick={() => setInternalOpen(o => !o)}
          >
            <span className="odf-pill-plus">+</span> Internal Notes
          </button>
          <button
            type="button"
            className={`odf-pill-btn ${externalOpen ? 'active' : ''}`}
            onClick={() => setExternalOpen(o => !o)}
          >
            <span className="odf-pill-plus">+</span> External Notes
          </button>
        </div>
        {internalOpen && (
          <textarea
            className="odf-notes-textarea"
            placeholder="Internal note..."
            value={internalText}
            onChange={e => setInternalText(e.target.value)}
          />
        )}
        {externalOpen && (
          <textarea
            className="odf-notes-textarea"
            placeholder="External note..."
            value={externalText}
            onChange={e => setExternalText(e.target.value)}
          />
        )}
      </div>
    </DetailField>
  )
}

function AttachmentsField({
  attachment = '',
  includePdf = false,
  disabled = false,
}: {
  attachment?: string
  includePdf?: boolean
  disabled?: boolean
}) {
  const [selected, setSelected] = useState(attachment)
  const [includePdfState, setIncludePdfState] = useState(includePdf)
  const fileInputId = useMemo(() => `odf-browse-${Math.random().toString(36).slice(2, 8)}`, [])

  if (disabled) {
    return (
      <>
        <DetailField label="Attachments">
          <div className="odf-attachments-select">
            <Dropdown
              placeholder="Select Attachments"
              value={attachment}
              onChange={() => {}}
              options={ATTACHMENT_OPTIONS}
              disabled
            />
          </div>
        </DetailField>
        <div className="odf-row odf-row-toggle">
          <span className="odf-label" />
          <div className="odf-content odf-pdf-toggle-row">
            <button
              type="button"
              role="switch"
              aria-checked={includePdf}
              className={`odf-toggle ${includePdf ? 'on' : ''}`}
              disabled
            >
              <span className="odf-toggle-knob" />
            </button>
            <span className="odf-pdf-toggle-label">Include chart note PDF</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DetailField label="Attachments">
        <div className="odf-attachments-select">
          <Dropdown placeholder="Select Attachments" value={selected} onChange={setSelected} options={ATTACHMENT_OPTIONS} />
        </div>
      </DetailField>
      <div className="odf-row odf-row-toggle">
        <span className="odf-label" />
        <div className="odf-content odf-pdf-toggle-row">
          <button
            type="button"
            role="switch"
            aria-checked={includePdf}
            className={`odf-toggle ${includePdfState ? 'on' : ''}`}
            onClick={() => setIncludePdfState(v => !v)}
          >
            <span className="odf-toggle-knob" />
          </button>
          <span className="odf-pdf-toggle-label">Include chart note PDF</span>
        </div>
      </div>
      <div className="odf-row">
        <span className="odf-label" />
        <div className="odf-content">
          <div className="odf-dropzone">
            <CloudIcon />
            <span>
              drop files here or{' '}
              <label className="odf-browse-link" htmlFor={fileInputId}>
                Browse Files
              </label>
            </span>
            <input id={fileInputId} type="file" multiple hidden />
          </div>
        </div>
      </div>
    </>
  )
}

function DiagnosisChipsField({
  chips,
  onAdd,
  onRemove,
  options,
  disabled = false,
}: {
  chips: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  options: string[]
  disabled?: boolean
}) {
  const [adding, setAdding] = useState(false)
  const available = options.filter(o => !chips.includes(o))
  return (
    <DetailField label="Diagnosis Code" align="start">
      <div className="odf-chips-wrap">
        {chips.map(c => (
          <span className="odf-chip" key={c}>
            {c}
            {!disabled && (
              <button type="button" className="odf-chip-remove" aria-label={`Remove ${c}`} onClick={() => onRemove(c)}>
                <CloseIcon />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          adding ? (
            <div className="odf-chip-add-dropdown">
              <SearchableDropdown
                placeholder="Diagnosis"
                value=""
                onChange={v => {
                  onAdd(v)
                  setAdding(false)
                }}
                options={available}
                emptyMessage="No matching diagnosis codes"
                searchPlaceholder="Search diagnosis..."
              />
            </div>
          ) : (
            <button type="button" className="odf-chip-add-btn" onClick={() => setAdding(true)}>
              <span className="odf-chip-add-plus">+</span> Add
            </button>
          )
        )}
      </div>
    </DetailField>
  )
}

function SigField({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <DetailField label="SIG" align="start">
        <div className="odf-sig">
          <textarea className="odf-sig-textarea" value={value} readOnly disabled />
        </div>
      </DetailField>
    )
  }

  return (
    <DetailField label="SIG" align="start">
      <div className="odf-sig">
        <textarea
          className="odf-sig-textarea"
          placeholder="Write or select a SIG..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <div className="odf-sig-chips">
          <button type="button" className="odf-sig-chip odf-sig-chip-smart" onClick={() => onChange('Take 1 tablet by mouth twice daily as directed.')}>
            <span className="odf-sig-chip-sparkle">✦</span> Smart Gen
          </button>
          {SAVED_SIG_OPTIONS.map((s, i) => (
            <button type="button" key={i} className="odf-sig-chip" onClick={() => onChange(s)}>
              Saved #{i + 1}
            </button>
          ))}
        </div>
        <button type="button" className="odf-sig-validate">
          Validate with AI
        </button>
      </div>
    </DetailField>
  )
}

function AdditionalFieldsSection({
  children,
  defaultOpen = true,
  disabled = false,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="odf-additional">
      <button
        type="button"
        className="odf-additional-toggle"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        Additional Fields
        <span className={`odf-additional-chevron ${open ? '' : 'collapsed'}`}>
          <ChevronUpIcon />
        </span>
      </button>
      {open && <div className="odf-additional-content">{children}</div>}
    </div>
  )
}

type VisitNoteOrderKind = 'injection' | 'imaging' | 'lab'

function VisitNoteOrderDetail({
  orderName,
  kind,
  disabled,
}: {
  orderName: string
  kind: VisitNoteOrderKind
  disabled: boolean
}) {
  const details = getOrderDetails(orderName)
  const isProcedure = kind === 'injection'
  const isImaging = kind === 'imaging'
  const isLab = kind === 'lab'
  const isJ1010 = details.cpt === 'J1010'
  const coded =
    details.cpt && details.cpt !== 'CPT Code' ? `${details.cpt} - ${details.description}` : ''
  const procedureOptions = coded && !PROCEDURE_OPTIONS.includes(coded) ? [coded, ...PROCEDURE_OPTIONS] : PROCEDURE_OPTIONS
  const cptOptions = coded && !CPT_OPTIONS.includes(coded) ? [coded, ...CPT_OPTIONS] : CPT_OPTIONS

  const [procedure, setProcedure] = useState(coded)
  const [orderTitle, setOrderTitle] = useState(isProcedure ? '' : details.description)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [inHouse, setInHouse] = useState(true)
  const [contactSource, setContactSource] = useState<'NPI' | 'Contact List'>('NPI')
  const [sig, setSig] = useState('')
  const [expiry, setExpiry] = useState('')
  const [lot, setLot] = useState('')
  const [ndcValue, setNdcValue] = useState('')
  const [unitsValue, setUnitsValue] = useState(isJ1010 ? 'Unit' : '')
  const [quantity, setQuantity] = useState(isJ1010 ? '40' : '')
  const [route, setRoute] = useState('')
  const [modifier, setModifier] = useState('')
  const [icd10, setIcd10] = useState('')
  const [priority, setPriority] = useState(isLab ? 'No Priority' : '')
  const [resultMedium, setResultMedium] = useState('')
  const [specimenCollected, setSpecimenCollected] = useState(false)
  const [notes, setNotes] = useState('')
  const [includePdf, setIncludePdf] = useState(false)

  const contactsDisabled = disabled || (isProcedure && inHouse && !requiresAuth)
  const radioName = `vn-contacts-${kind}-${orderName.replace(/[^a-zA-Z0-9]/g, '-')}`

  return (
    <div className={`odf odf-procedure ${disabled ? 'odf-readonly' : ''}`}>
      {isProcedure ? (
        <DetailField label="Procedure / Injection">
          <div className="odf-facility-dropdown odf-procedure-dropdown">
            <Dropdown
              placeholder="Select procedure"
              value={procedure}
              onChange={setProcedure}
              options={procedureOptions}
              disabled={disabled}
            />
          </div>
        </DetailField>
      ) : (
        <DetailField label="CPT Code">
          <div className="odf-facility-dropdown odf-procedure-dropdown">
            <Dropdown
              placeholder="Select CPT code"
              value={procedure}
              onChange={setProcedure}
              options={cptOptions}
              disabled={disabled}
            />
          </div>
        </DetailField>
      )}
      <DetailField label="Order Name">
        <input
          type="text"
          className="odf-text-input odf-text-input-bare"
          value={orderTitle}
          onChange={e => setOrderTitle(e.target.value)}
          placeholder="Enter order name"
          readOnly={disabled}
          disabled={disabled}
        />
      </DetailField>
      <DetailField label="Requires Authorization" align="start">
        <div className="odf-auth-stack">
          <DetailCheckbox
            checked={requiresAuth}
            onChange={setRequiresAuth}
            label="Requires Authorization"
            disabled={disabled}
          />
          {requiresAuth && (
            <>
              <div className="odf-facility-dropdown odf-procedure-dropdown">
                <Dropdown
                  placeholder="No other orders on this visit"
                  value=""
                  onChange={() => {}}
                  options={[]}
                  disabled
                />
              </div>
              <div className="odf-facility-dropdown">
                <Dropdown
                  placeholder="Assign to..."
                  value={assignedTo}
                  onChange={setAssignedTo}
                  options={ASSIGNEE_OPTIONS}
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </div>
      </DetailField>
      {isProcedure && (
        <DetailField label="Procedure Location">
          <DetailCheckbox
            checked={inHouse}
            onChange={setInHouse}
            label="Procedure administered in-house"
            disabled={disabled || requiresAuth}
          />
        </DetailField>
      )}
      <DetailField label="Include contacts from:">
        <div className={`odf-radio-row ${contactsDisabled ? 'odf-muted' : ''}`}>
          <label className="odf-radio">
            <input
              type="radio"
              name={radioName}
              checked={contactSource === 'NPI'}
              disabled={contactsDisabled}
              onChange={() => setContactSource('NPI')}
            />
            NPI
          </label>
          <label className="odf-radio">
            <input
              type="radio"
              name={radioName}
              checked={contactSource === 'Contact List'}
              disabled={contactsDisabled}
              onChange={() => setContactSource('Contact List')}
            />
            Contact List
          </label>
        </div>
      </DetailField>
      <DetailField label="Recipients" align="start">
        <div className={contactsDisabled ? 'odf-muted' : undefined}>
          <div className="odf-attachments-select">
            <Dropdown
              placeholder="Select Recipients"
              value=""
              onChange={() => {}}
              options={RECIPIENT_OPTIONS}
              disabled={contactsDisabled}
            />
          </div>
        </div>
      </DetailField>
      <DetailField label="Diagnosis Codes">
        <div className="odf-facility-dropdown odf-procedure-dropdown">
          <Dropdown
            placeholder={isImaging ? 'Add here...' : 'Search for diagnosis codes...'}
            value={icd10}
            onChange={setIcd10}
            options={PROCEDURE_ICD10_OPTIONS}
            disabled={disabled}
          />
        </div>
      </DetailField>
      {isProcedure && (
        <>
          <DetailField label="SIG" align="start">
            <textarea
              className="odf-notes-textarea"
              placeholder="Write a SIG..."
              value={sig}
              onChange={e => setSig(e.target.value)}
              rows={2}
              readOnly={disabled}
              disabled={disabled}
            />
          </DetailField>
          <div className="odf-procedure-gap" />
          <DetailField label="Drug Expiry Date">
            <input
              type="text"
              className="odf-text-input odf-text-input-bare"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              placeholder="MM/DD/YYYY"
              readOnly={disabled}
              disabled={disabled}
            />
          </DetailField>
          <DetailField label="Lot Number">
            <input
              type="text"
              className="odf-text-input odf-text-input-bare"
              value={lot}
              onChange={e => setLot(e.target.value)}
              placeholder="Enter Lot Number"
              readOnly={disabled}
              disabled={disabled}
            />
          </DetailField>
          <DetailField label="NDC">
            <input
              type="text"
              className="odf-text-input odf-text-input-bare"
              value={ndcValue}
              onChange={e => setNdcValue(e.target.value)}
              placeholder="XXXX-XXXX-XX"
              readOnly={disabled}
              disabled={disabled}
            />
          </DetailField>
          <DetailField label="Units">
            <div className="odf-facility-dropdown">
              <Dropdown
                placeholder={isJ1010 ? 'Unit' : 'Select Units'}
                value={unitsValue}
                onChange={setUnitsValue}
                options={PROCEDURE_UNIT_OPTIONS}
                disabled={disabled}
              />
            </div>
          </DetailField>
          <DetailField label="Quantity of Units">
            <input
              type="text"
              className="odf-text-input odf-text-input-bare"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Enter the number of units"
              readOnly={disabled}
              disabled={disabled}
            />
          </DetailField>
          <DetailField label="Route">
            <div className="odf-facility-dropdown">
              <Dropdown
                placeholder="Select Route"
                value={route}
                onChange={setRoute}
                options={PROCEDURE_ROUTE_OPTIONS}
                disabled={disabled}
              />
            </div>
          </DetailField>
          <DetailField label="Modifiers">
            <div className="odf-facility-dropdown">
              <Dropdown
                placeholder="Add modifiers..."
                value={modifier}
                onChange={setModifier}
                options={PROCEDURE_MODIFIER_OPTIONS}
                disabled={disabled}
              />
            </div>
          </DetailField>
        </>
      )}
      {(isImaging || isLab) && (
        <DetailField label="Priority">
          <div className="odf-facility-dropdown">
            <Dropdown
              placeholder="Select priority"
              value={priority}
              onChange={setPriority}
              options={PRIORITY_OPTIONS}
              disabled={disabled}
            />
          </div>
        </DetailField>
      )}
      {isImaging && (
        <DetailField label="Result Medium">
          <input
            type="text"
            className="odf-text-input odf-text-input-bare"
            value={resultMedium}
            onChange={e => setResultMedium(e.target.value)}
            placeholder="Write result medium..."
            readOnly={disabled}
            disabled={disabled}
          />
        </DetailField>
      )}
      <DetailField label="Notes" align="start">
        <textarea
          className="odf-notes-textarea"
          placeholder={isProcedure ? 'Write note' : 'Write note.'}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          readOnly={disabled}
          disabled={disabled}
        />
      </DetailField>
      <div className="odf-procedure-gap" />
      {isLab && (
        <DetailField label="Specimen Collected">
          <button
            type="button"
            role="switch"
            aria-checked={specimenCollected}
            className={`odf-toggle ${specimenCollected ? 'on' : ''}`}
            onClick={() => !disabled && setSpecimenCollected(v => !v)}
            disabled={disabled}
          >
            <span className="odf-toggle-knob" />
          </button>
        </DetailField>
      )}
      <DetailField label="Include Chart Note PDF">
        <button
          type="button"
          role="switch"
          aria-checked={includePdf}
          className={`odf-toggle ${includePdf ? 'on' : ''}`}
          onClick={() => !disabled && setIncludePdf(v => !v)}
          disabled={disabled}
        >
          <span className="odf-toggle-knob" />
        </button>
      </DetailField>
      <div className="odf-procedure-footer">
        <span>Created by Ruzbeh Irani</span>
        {!disabled && (
          <button type="button" className="odf-complete-send">
            Complete & Send Order
          </button>
        )}
      </div>
    </div>
  )
}

export function OrderBreakdownDetail({
  orderName,
  allDiagnosisOptions,
  onDiagnosisCodeAdd,
  diagnosisCodes: diagnosisCodesProp,
  onDiagnosisCodesChange,
  editable = false,
}: {
  orderName: string
  onDiagnosisCodeAdd?: (fullCode: string) => void
  allDiagnosisOptions: string[]
  diagnosisCodes?: string[]
  onDiagnosisCodesChange?: (codes: string[]) => void
  editable?: boolean
}) {
  const category = inferOrderCategory(orderName)
  const cfg = useMemo(() => getOrderPreconfig(orderName, category), [orderName, category])
  const disabled = !editable

  const [internalDiagnosisCodes, setInternalDiagnosisCodes] = useState<string[]>([])
  const diagnosisCodes = onDiagnosisCodesChange ? (diagnosisCodesProp ?? []) : internalDiagnosisCodes
  const setDiagnosisCodes = onDiagnosisCodesChange ?? setInternalDiagnosisCodes
  const displayDiagnosisCodes = diagnosisCodes.length > 0 ? diagnosisCodes : (cfg.diagnosisCodes ?? [])

  useEffect(() => {
    if (!diagnosisCodes.length && cfg.diagnosisCodes?.length) {
      setDiagnosisCodes(cfg.diagnosisCodes)
      cfg.diagnosisCodes.forEach(code => onDiagnosisCodeAdd?.(code))
    }
  }, [orderName, diagnosisCodes.length, cfg.diagnosisCodes, setDiagnosisCodes, onDiagnosisCodeAdd])

  const addDiagnosisChip = (code: string) => {
    if (!code || displayDiagnosisCodes.includes(code)) return
    setDiagnosisCodes([...displayDiagnosisCodes, code])
    onDiagnosisCodeAdd?.(code)
  }
  const removeDiagnosisChip = (code: string) => setDiagnosisCodes(displayDiagnosisCodes.filter(c => c !== code))

  const [facility, setFacility] = useState(editable ? '' : (cfg.facility ?? ''))
  const [dispenseInHouse, setDispenseInHouse] = useState(cfg.dispenseInHouse ?? false)
  const [sendDate, setSendDate] = useState(cfg.sendDate ?? '')
  const [quantity, setQuantity] = useState(cfg.quantity ?? '')
  const [refills, setRefills] = useState(cfg.refills ?? '')
  const [modifiers, setModifiers] = useState<string[]>(cfg.modifiers?.length ? cfg.modifiers : [''])
  const [expectsResponse, setExpectsResponse] = useState(cfg.expectsResponse ?? false)
  const [sig, setSig] = useState(cfg.sig ?? '')
  const pharmacyOptions = category === 'medication' || category === 'dme' ? PHARMACY_OPTIONS : FACILITY_OPTIONS
  const facilityPlaceholder =
    category === 'referral' ? 'Select Provider' : category === 'medication' || category === 'dme' ? 'Select Pharmacy' : 'Select Facility'

  if (category === 'medication' || category === 'dme') {
    return (
      <div className={`odf ${disabled ? 'odf-readonly' : ''}`}>
        <DetailField label="Send To">
          <div className="odf-send-to">
            <div className="odf-facility-dropdown">
              <Dropdown placeholder={facilityPlaceholder} value={facility} onChange={setFacility} options={pharmacyOptions} disabled={disabled} />
            </div>
            <DetailCheckbox checked={dispenseInHouse} onChange={setDispenseInHouse} label="Dispense In-House" disabled={disabled} />
          </div>
        </DetailField>
        <div className="odf-row">
          <span className="odf-label" />
          <div className="odf-content">
            <DetailAddress />
          </div>
        </div>
        <DetailField label="Dispense">
          <div className="odf-dispense">
            <span className="odf-dispense-label">Quantity</span>
            <input type="text" className="odf-dispense-input" value={quantity} onChange={e => setQuantity(e.target.value)} readOnly={disabled} disabled={disabled} placeholder="0" />
            <span className="odf-dispense-divider" />
            <span className="odf-dispense-label">Refills</span>
            <input type="text" className="odf-dispense-input" value={refills} onChange={e => setRefills(e.target.value)} readOnly={disabled} disabled={disabled} placeholder="0" />
          </div>
        </DetailField>
        <SigField value={sig} onChange={setSig} disabled={disabled} />
        <AdditionalFieldsSection disabled={disabled} defaultOpen>
          {category === 'dme' && <ModifiersField values={modifiers} onChange={setModifiers} disabled={disabled} />}
          <NotesField internalNote={cfg.internalNote} externalNote={cfg.externalNote} disabled={disabled} />
          <AttachmentsField attachment={cfg.attachment} includePdf={cfg.includePdf} disabled={disabled} />
        </AdditionalFieldsSection>
        <DiagnosisChipsField
          chips={displayDiagnosisCodes}
          onAdd={addDiagnosisChip}
          onRemove={removeDiagnosisChip}
          options={allDiagnosisOptions}
          disabled={disabled}
        />
      </div>
    )
  }

  if (category === 'referral') {
    return (
      <div className={`odf ${disabled ? 'odf-readonly' : ''}`}>
        <DetailField label="Send To">
          <div className="odf-facility-dropdown">
            <Dropdown placeholder={facilityPlaceholder} value={facility} onChange={setFacility} options={PROVIDER_OPTIONS} disabled={disabled} />
          </div>
        </DetailField>
        <div className="odf-row">
          <span className="odf-label" />
          <div className="odf-content">
            <DetailAddress />
          </div>
        </div>
        <DetailDivider label="Optional Fields" />
        <DetailField label="Send Date">
          <input type="date" className="odf-date-input" value={sendDate} onChange={e => setSendDate(e.target.value)} readOnly={disabled} disabled={disabled} />
        </DetailField>
        <DetailField label="Expects Response">
          <DetailCheckbox checked={expectsResponse} onChange={setExpectsResponse} disabled={disabled} />
        </DetailField>
        <AdditionalFieldsSection disabled={disabled} defaultOpen>
          <NotesField internalNote={cfg.internalNote} externalNote={cfg.externalNote} disabled={disabled} />
          <AttachmentsField attachment={cfg.attachment} includePdf={cfg.includePdf} disabled={disabled} />
        </AdditionalFieldsSection>
        <DiagnosisChipsField
          chips={displayDiagnosisCodes}
          onAdd={addDiagnosisChip}
          onRemove={removeDiagnosisChip}
          options={allDiagnosisOptions}
          disabled={disabled}
        />
      </div>
    )
  }

  if (category === 'imaging') {
    return <VisitNoteOrderDetail orderName={orderName} kind="imaging" disabled={disabled} />
  }

  if (category === 'lab') {
    return <VisitNoteOrderDetail orderName={orderName} kind="lab" disabled={disabled} />
  }

  return <VisitNoteOrderDetail orderName={orderName} kind="injection" disabled={disabled} />
}

function OrderBreakdownItem({
  orderKey,
  label,
  expanded,
  onToggleExpanded,
  onRemove,
  onDiagnosisCodeAdd,
  allDiagnosisOptions,
  diagnosisCodes,
  onDiagnosisCodesChange,
  editable = false,
}: {
  orderKey: string
  label: string
  expanded: boolean
  onToggleExpanded: () => void
  onRemove?: () => void
  onDiagnosisCodeAdd?: (fullCode: string) => void
  allDiagnosisOptions: string[]
  diagnosisCodes?: string[]
  onDiagnosisCodesChange?: (codes: string[]) => void
  editable?: boolean
}) {
  return (
    <div className="order-row-wrapper">
      <div className="order-row">
        <OrderRowIcon category={inferOrderCategory(orderKey)} />
        <span className="order-row-title">{label}</span>
        <button
          type="button"
          className={`order-row-chevron ${expanded ? 'expanded' : ''}`}
          aria-label="Toggle order details"
          onClick={onToggleExpanded}
        >
          <ChevronDownIcon />
        </button>
        {onRemove && (
          <button type="button" className="order-row-delete" aria-label={`Remove ${label}`} onClick={onRemove}>
            <TrashIcon />
          </button>
        )}
      </div>
      {expanded && (
        <OrderBreakdownDetail
          orderName={orderKey}
          onDiagnosisCodeAdd={onDiagnosisCodeAdd}
          allDiagnosisOptions={allDiagnosisOptions}
          diagnosisCodes={diagnosisCodes}
          onDiagnosisCodesChange={onDiagnosisCodesChange}
          editable={editable}
        />
      )}
    </div>
  )
}

function OrderSetComponent({
  onRemove,
  allDiagnosisOptions = [],
  onDiagnosisCodeAdd,
  selectedOrders: selectedOrdersProp,
  onSelectedOrdersChange,
  orderDiagnosisCodes: orderDiagnosisCodesProp = {},
  onOrderDiagnosisChange,
}: OrderSetComponentProps) {
  const [internalOrderDiagnosisCodes, setInternalOrderDiagnosisCodes] = useState<OrderDiagnosisMap>({})
  const orderDiagnosisCodes = onOrderDiagnosisChange ? orderDiagnosisCodesProp : internalOrderDiagnosisCodes

  const handleOrderDiagnosisChange = (orderKey: string, codes: string[]) => {
    if (onOrderDiagnosisChange) {
      onOrderDiagnosisChange(orderKey, codes)
    } else {
      setInternalOrderDiagnosisCodes(prev => ({ ...prev, [orderKey]: codes }))
    }
  }
  const [internalSelectedOrders, setInternalSelectedOrders] = useState<string[]>([])
  const selectedOrders = selectedOrdersProp ?? internalSelectedOrders
  const setSelectedOrders = onSelectedOrdersChange ?? setInternalSelectedOrders

  const orderOptions = [...Object.keys(ORDER_SETS), ...INDIVIDUAL_ORDERS]

  const selectedOrderSets = selectedOrders.filter(o => o in ORDER_SETS)
  const selectedIndividual = selectedOrders.filter(o => !(o in ORDER_SETS))

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleExpanded = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  const handleToggleOrder = (option: string) => {
    if (selectedOrders.includes(option)) {
      setSelectedOrders(selectedOrders.filter(o => o !== option))
    } else {
      setSelectedOrders([...selectedOrders, option])
    }
  }

  const removeOrderSet = (setName: string) => {
    setSelectedOrders(selectedOrders.filter(o => o !== setName))
  }

  const removeIndividualOrder = (name: string) => {
    setSelectedOrders(selectedOrders.filter(o => o !== name))
  }

  return (
    <div className="order-set-component">
      <div className="order-set-header">
        <div className="order-set-header-left">
          <h3 className="order-set-title">Order / Order Sets</h3>
          <AddOrderMenu
            options={orderOptions}
            selectedOrders={selectedOrders}
            onToggle={handleToggleOrder}
          />
        </div>
        {onRemove && (
          <button className="order-set-delete-button" aria-label="Delete" onClick={onRemove}>
            <TrashIcon />
          </button>
        )}
      </div>
      <div className="order-set-content">
        {selectedOrders.length > 0 ? (
          <div className="order-breakdown">
            {selectedOrderSets.map(setName => (
              <div key={setName} className="order-set-block">
                <div className="order-set-block-header">
                  <span className="order-set-block-title">{setName}</span>
                  <LinkIcon />
                  <button
                    type="button"
                    className="order-row-delete"
                    aria-label={`Remove ${setName}`}
                    onClick={() => removeOrderSet(setName)}
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="order-set-block-rows">
                  {(ORDER_SETS[setName] ?? []).map(orderKey => {
                    const rowId = `${setName}::${orderKey}`
                    return (
                      <OrderBreakdownItem
                        key={rowId}
                        orderKey={orderKey}
                        label={getOrderDetails(orderKey).description}
                        expanded={expandedRows.has(rowId)}
                        onToggleExpanded={() => toggleExpanded(rowId)}
                        onDiagnosisCodeAdd={onDiagnosisCodeAdd}
                        allDiagnosisOptions={allDiagnosisOptions}
                        diagnosisCodes={orderDiagnosisCodes[orderKey] ?? []}
                        onDiagnosisCodesChange={codes => handleOrderDiagnosisChange(orderKey, codes)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            {selectedIndividual.length > 0 && (
              <div className="order-set-block">
                <div className="order-set-block-header order-set-block-header-plain">
                  <span className="order-set-block-title">Individual Orders</span>
                </div>
                <div className="order-set-block-rows">
                  {selectedIndividual.map(name => {
                    const rowId = `individual::${name}`
                    return (
                      <OrderBreakdownItem
                        key={rowId}
                        orderKey={name}
                        label={getOrderDetails(name).description}
                        expanded={expandedRows.has(rowId)}
                        onToggleExpanded={() => toggleExpanded(rowId)}
                        onRemove={() => removeIndividualOrder(name)}
                        onDiagnosisCodeAdd={onDiagnosisCodeAdd}
                        allDiagnosisOptions={allDiagnosisOptions}
                        diagnosisCodes={orderDiagnosisCodes[name] ?? []}
                        onDiagnosisCodesChange={codes => handleOrderDiagnosisChange(name, codes)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="order-set-empty">No orders added yet. Click + Add Order to get started.</span>
        )}
      </div>
    </div>
  )
}

export default OrderSetComponent

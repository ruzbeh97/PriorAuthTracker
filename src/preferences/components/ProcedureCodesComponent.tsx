import { useState, useEffect, useMemo, useRef } from 'react'
import Dropdown from './Dropdown'
import { KNEE_PROCEDURE_CODE_OPTIONS, type OrderDiagnosisMap, type ProcedureCodeConfig } from '../data/snippetServices'
import { ORDER_SETS, getOrderDetails } from '../data/snippetOrders'
import { diagnosisToIcd10Options, buildIcd10OptionDescriptions } from './DiagnosisCodesComponent'
import './ProcedureCodesComponent.css'

interface ProcedureCodesComponentProps {
  onRemove?: () => void
  config?: ProcedureCodeConfig[]
  onConfigChange?: (config: ProcedureCodeConfig[]) => void
  selectedOrders?: string[]
  diagnosisCodes?: string[]
  orderDiagnosisCodes?: OrderDiagnosisMap
}

interface ManualServiceRow {
  id: string
  cpt: string
  description: string
  mod: string
  icds: string[]
  units: string
}

const MOD_OPTIONS = ['LT', 'RT', '50', '59', 'XS']
export const SERVICE_OPTIONS = [
  ...KNEE_PROCEDURE_CODE_OPTIONS,
  '75959 - Xray place dist ext thor ao',
  '75956 - Xray endovasc thor ao repr',
  '85027 - Complete cbc, automated',
  '20610 - Drain/inj joint/bursa w/o us',
  'J1010 - Injection, methylprednisolone acetate, 1 mg',
  '27447 - Total knee arthroplasty',
  '27130 - Total hip arthroplasty',
]

export function parseCptOption(option: string): { cpt: string; description: string } {
  const idx = option.indexOf(' - ')
  if (idx === -1) return { cpt: option.trim(), description: option }
  return { cpt: option.slice(0, idx).trim(), description: option.slice(idx + 3).trim() }
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

function ServiceTableHeader({ title }: { title: string }) {
  return (
    <div className="svc-table-header">
      <span className="svc-table-header-title">{title}</span>
      <span className="svc-table-header-icd">ICD-10</span>
      <span className="svc-table-header-units">Units</span>
    </div>
  )
}

function AddServicesMenu({
  options,
  onSelect,
}: {
  options: string[]
  onSelect: (option: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="svc-add-wrapper" ref={ref}>
      <button type="button" className="svc-add-button" onClick={() => setIsOpen(o => !o)}>
        Add Services
      </button>
      {isOpen && (
        <div className="svc-add-menu">
          {options.map(option => (
            <button
              key={option}
              type="button"
              className="svc-add-option"
              onClick={() => {
                onSelect(option)
                setIsOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProcedureCodesComponent({
  onRemove,
  config,
  onConfigChange,
  selectedOrders = [],
  diagnosisCodes = [],
  orderDiagnosisCodes = {},
}: ProcedureCodesComponentProps) {
  const icdOptions = useMemo(() => diagnosisToIcd10Options(diagnosisCodes), [diagnosisCodes])
  const icdOptionDescriptions = useMemo(
    () => buildIcd10OptionDescriptions(diagnosisCodes),
    [diagnosisCodes]
  )
  const defaultIcd = icdOptions[0] ?? ''

  const [serviceRows, setServiceRows] = useState<ManualServiceRow[]>(() =>
    (config ?? []).map((c, i) => ({
      id: `svc-${i}`,
      cpt: c.cptCode,
      description: c.description || c.cptCode,
      mod: c.modifiers[0] ?? '',
      icds: c.icds?.filter(Boolean).length ? c.icds.filter(Boolean) : defaultIcd ? [defaultIcd] : [''],
      units: c.units,
    }))
  )

  const orderRows = useMemo(() => {
    const rows: Array<{
      orderKey: string
      cpt: string
      description: string
      fullDiagnosisCodes: string[]
    }> = []
    selectedOrders.forEach(selection => {
      const keys = ORDER_SETS[selection] ?? [selection]
      keys.forEach(key => {
        const { cpt, description } = getOrderDetails(key)
        if (cpt === 'CPT Code') return
        rows.push({
          orderKey: key,
          cpt,
          description,
          fullDiagnosisCodes: orderDiagnosisCodes[key] ?? [],
        })
      })
    })
    return rows
  }, [selectedOrders, orderDiagnosisCodes])

  useEffect(() => {
    onConfigChange?.(
      serviceRows
        .filter(r => r.cpt)
        .map(r => ({
          cptCode: r.cpt,
          description: r.description,
          modifiers: r.mod ? [r.mod] : [''],
          units: r.units,
          icds: r.icds.filter(Boolean),
        }))
    )
  }, [serviceRows, onConfigChange])

  const availableOptions = SERVICE_OPTIONS.filter(
    opt => !serviceRows.some(r => r.cpt === parseCptOption(opt).cpt)
  )

  const addService = (option: string) => {
    const { cpt, description } = parseCptOption(option)
    setServiceRows(prev => [
      ...prev,
      {
        id: `svc-${Date.now()}`,
        cpt,
        description,
        mod: '',
        icds: defaultIcd ? [defaultIcd] : [''],
        units: '',
      },
    ])
  }

  const removeService = (id: string) => setServiceRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: string, patch: Partial<ManualServiceRow>) =>
    setServiceRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))

  const setIcd = (id: string, index: number, value: string) =>
    setServiceRows(prev =>
      prev.map(r =>
        r.id === id ? { ...r, icds: r.icds.map((icd, i) => (i === index ? value : icd)) } : r
      )
    )

  const addIcd = (id: string) =>
    setServiceRows(prev =>
      prev.map(r => (r.id === id ? { ...r, icds: [...r.icds, ''] } : r))
    )

  const removeIcd = (id: string) =>
    setServiceRows(prev =>
      prev.map(r => (r.id === id && r.icds.length > 1 ? { ...r, icds: r.icds.slice(0, -1) } : r))
    )

  return (
    <div className="svc-component">
      <div className="svc-header">
        <div className="svc-header-left">
          <h3 className="svc-title">Services</h3>
          <AddServicesMenu options={availableOptions} onSelect={addService} />
        </div>
        {onRemove && (
          <button type="button" className="svc-delete-button" aria-label="Delete" onClick={onRemove}>
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="svc-content">
        {orderRows.length > 0 && (
          <div className="svc-section">
            <ServiceTableHeader title="Orders & Order Sets" />
            {orderRows.map(row => {
              const rowIcdOptions = diagnosisToIcd10Options(row.fullDiagnosisCodes)
              const rowIcdDescriptions = buildIcd10OptionDescriptions(row.fullDiagnosisCodes)
              const icdsToShow = rowIcdOptions.length ? rowIcdOptions : ['']

              return (
              <div className="svc-row svc-row-order" key={row.orderKey}>
                <div className="svc-row-main">
                  <span className="svc-cpt svc-cpt-muted">{row.cpt}</span>
                  <div className="svc-mod">
                    <Dropdown placeholder="Mod" value="" onChange={() => {}} options={MOD_OPTIONS} disabled />
                  </div>
                  <span className="svc-desc svc-desc-muted">{row.description}</span>
                </div>
                <div className="svc-row-icds">
                  {icdsToShow.map((icd, i) => (
                    <div className="svc-icd-row" key={i}>
                      <div className="svc-icd">
                        <Dropdown
                          placeholder="ICD-10"
                          value={icd}
                          onChange={() => {}}
                          options={rowIcdOptions}
                          optionDescriptions={rowIcdDescriptions}
                          menuClassName="dropdown-menu-icd10"
                          emptyMessage="No diagnosis codes for this order"
                          disabled
                        />
                      </div>
                      <span className="svc-icd-spacer" />
                      <span className="svc-icd-spacer" />
                    </div>
                  ))}
                </div>
                <input type="text" className="svc-units svc-units-disabled" placeholder="Units" readOnly disabled />
                <span className="svc-row-action-spacer" />
              </div>
              )
            })}
          </div>
        )}

        {serviceRows.length > 0 && (
          <div className="svc-section">
            <ServiceTableHeader title="Services" />
            {serviceRows.map(row => (
              <div className="svc-row" key={row.id}>
                <div className="svc-row-main">
                  <input type="text" className="svc-cpt svc-cpt-input" value={row.cpt} readOnly />
                  <div className="svc-mod">
                    <Dropdown
                      placeholder="Mod"
                      value={row.mod}
                      onChange={v => updateRow(row.id, { mod: v })}
                      options={MOD_OPTIONS}
                    />
                  </div>
                  <span className="svc-desc">{row.description}</span>
                </div>
                <div className="svc-row-icds">
                  {row.icds.map((icd, i) => {
                    const isLast = i === row.icds.length - 1
                    return (
                      <div className="svc-icd-row" key={i}>
                        <div className="svc-icd">
                          <Dropdown
                            placeholder="ICD-10"
                            value={icd}
                            onChange={v => setIcd(row.id, i, v)}
                            options={icdOptions}
                            optionDescriptions={icdOptionDescriptions}
                            menuClassName="dropdown-menu-icd10"
                            emptyMessage="No diagnosis codes selected"
                          />
                        </div>
                        <button
                          type="button"
                          className="svc-icd-action"
                          aria-label="Remove ICD-10"
                          onClick={() => removeIcd(row.id)}
                          disabled={row.icds.length <= 1}
                        >
                          <MinusIcon />
                        </button>
                        {isLast ? (
                          <button
                            type="button"
                            className="svc-icd-action"
                            aria-label="Add ICD-10"
                            onClick={() => addIcd(row.id)}
                          >
                            <PlusIcon />
                          </button>
                        ) : (
                          <span className="svc-icd-spacer" />
                        )}
                      </div>
                    )
                  })}
                </div>
                <input
                  type="text"
                  className="svc-units"
                  placeholder="Units"
                  value={row.units}
                  onChange={e => updateRow(row.id, { units: e.target.value })}
                />
                <button
                  type="button"
                  className="svc-row-delete"
                  aria-label="Remove service"
                  onClick={() => removeService(row.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcedureCodesComponent

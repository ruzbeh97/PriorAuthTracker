import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAssigneeGroups } from '../../assignees'
import {
  STATE_COLOR_OPTIONS,
  loadAuthStateConfig,
  saveAuthStateConfig,
  type AuthStateConfig,
} from '../../authStates'
import './PriorAuthPreferences.css'

interface PayerPortalRow {
  id: string
  payers: string[]
  url: string
}

const PAYER_PORTALS_KEY = 'prior-auth:pref-payer-portals'

const DEFAULT_PAYER_PORTALS: PayerPortalRow[] = [
  { id: 'payer-1', payers: ['BCBS', 'Aetna', 'Cigna'], url: 'http://payerportal.com' },
  { id: 'payer-2', payers: ['Medicare'], url: 'http://payerportal.com' },
  { id: 'payer-3', payers: ['Medicaid'], url: 'http://payerportal.com' },
  { id: 'payer-4', payers: ['UHC'], url: 'http://payerportal.com' },
  { id: 'payer-5', payers: ['Kaiser Permanente'], url: 'http://payerportal.com' },
  { id: 'payer-6', payers: ['Humana'], url: 'http://payerportal.com' },
  { id: 'payer-7', payers: ['Elevance'], url: 'http://payerportal.com' },
  { id: 'payer-8', payers: ['WellCare'], url: 'http://payerportal.com' },
  { id: 'payer-9', payers: ['HCSC'], url: 'http://payerportal.com' },
  { id: 'payer-10', payers: ['Oscar'], url: 'http://payerportal.com' },
]

const DEFAULT_NEW_STATE_COLOR = '#f2a8ae'
const ALL_GROUPS_SCOPE = 'all'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

function loadRows<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

function saveRows<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    /* ignore quota errors */
  }
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.3333 2.00004C11.5084 1.82493 11.7163 1.68605 11.9447 1.59131C12.1731 1.49658 12.4173 1.44775 12.6667 1.44775C12.916 1.44775 13.1602 1.49658 13.3886 1.59131C13.617 1.68605 13.8249 1.82493 14 2.00004C14.1751 2.17515 14.314 2.38306 14.4087 2.61146C14.5034 2.83986 14.5523 3.08407 14.5523 3.33337C14.5523 3.58268 14.5034 3.82689 14.4087 4.05529C14.314 4.28369 14.1751 4.4916 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2762C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2762C3.47381 14.0261 3.33334 13.687 3.33334 13.3333V4M5.33334 4V2.66667C5.33334 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33334 6.66667 1.33334H9.33334C9.68696 1.33334 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.3333 4L6 11.3333L2.66667 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DragHandleIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      {[3, 8, 13].map(y =>
        [2, 8].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" />),
      )}
    </svg>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d={direction === 'left' ? 'M10 3.5L5.5 8L10 12.5' : 'M6 3.5L10.5 8L6 12.5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface PaginationProps {
  total: number
  page: number
  rowsPerPage: number
  unitLabel: string
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}

function Pagination({
  total,
  page,
  rowsPerPage,
  unitLabel,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const first = total === 0 ? 0 : page * rowsPerPage + 1
  const last = Math.min(total, (page + 1) * rowsPerPage)
  const lastPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1)

  return (
    <div className="prior-auth-prefs-pagination">
      <div className="prior-auth-prefs-pagination-group">
        <span>Rows per page:</span>
        <select
          className="prior-auth-prefs-rows-select"
          value={rowsPerPage}
          onChange={event => onRowsPerPageChange(Number(event.target.value))}
          aria-label="Rows per page"
        >
          {ROWS_PER_PAGE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="prior-auth-prefs-pagination-group">
        <button
          className="prior-auth-prefs-icon-btn"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronIcon direction="left" />
        </button>
        <span className="prior-auth-prefs-page-range">
          {first} - {last} of {total} {unitLabel}
        </span>
        <button
          className="prior-auth-prefs-icon-btn"
          aria-label="Next page"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  )
}

function PayerPortalSection() {
  const [rows, setRows] = useState<PayerPortalRow[]>(() =>
    loadRows(PAYER_PORTALS_KEY, DEFAULT_PAYER_PORTALS),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    saveRows(PAYER_PORTALS_KEY, rows)
  }, [rows])

  const visibleRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  )

  const updateRow = (id: string, patch: Partial<PayerPortalRow>) => {
    setRows(current => current.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    const id = `payer-${Date.now()}`
    setRows(current => [...current, { id, payers: [], url: '' }])
    setPage(Math.floor(rows.length / rowsPerPage))
    setEditingId(id)
  }

  return (
    <section className="prior-auth-prefs-section">
      <div className="prior-auth-prefs-section-header">
        <div className="prior-auth-prefs-section-copy">
          <h2 className="prior-auth-prefs-section-title">Payer Portal URL</h2>
          <p className="prior-auth-prefs-section-description">
            {
              'Payer portal website URLs can be added here. The link assigned to the payer will be used when opening a payers website in Athelas.\n\nSuggestion: If a payer’s plans have a unique URLs, add the plan to the payer’s name when creating a link. Ex. BCBS - PPO Gold.'
            }
          </p>
        </div>
        <button className="prior-auth-prefs-add-btn" onClick={addRow}>
          + Payer Portal
        </button>
      </div>

      <div className="prior-auth-prefs-table">
        <div className="prior-auth-prefs-row is-header">
          <div className="prior-auth-prefs-cell col-payer">Payer</div>
          <div className="prior-auth-prefs-cell col-url">Payer URL</div>
          <div className="prior-auth-prefs-cell col-row-actions" />
        </div>

        {visibleRows.length === 0 ? (
          <div className="prior-auth-prefs-empty">No payer portals added yet.</div>
        ) : (
          visibleRows.map(row => {
            const isEditing = editingId === row.id
            return (
              <div key={row.id} className="prior-auth-prefs-row">
                <div className="prior-auth-prefs-cell col-payer">
                  {isEditing ? (
                    <input
                      className="prior-auth-prefs-input"
                      value={row.payers.join(', ')}
                      placeholder="Payer names, comma separated"
                      onChange={event =>
                        updateRow(row.id, {
                          payers: event.target.value
                            .split(',')
                            .map(payer => payer.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  ) : (
                    <div className="prior-auth-prefs-chip-row">
                      {row.payers.map(payer => (
                        <span key={payer} className="prior-auth-prefs-chip">
                          {payer}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="prior-auth-prefs-cell col-url">
                  {isEditing ? (
                    <input
                      className="prior-auth-prefs-input"
                      value={row.url}
                      placeholder="http://payerportal.com"
                      onChange={event => updateRow(row.id, { url: event.target.value })}
                    />
                  ) : (
                    <span className="prior-auth-prefs-truncate">{row.url}</span>
                  )}
                </div>
                <div className="prior-auth-prefs-cell col-row-actions">
                  <button
                    className="prior-auth-prefs-icon-btn"
                    aria-label={isEditing ? 'Done editing payer portal' : 'Edit payer portal'}
                    onClick={() => setEditingId(isEditing ? null : row.id)}
                  >
                    {isEditing ? <DoneIcon /> : <EditIcon />}
                  </button>
                  <button
                    className="prior-auth-prefs-icon-btn"
                    aria-label="Delete payer portal"
                    onClick={() => {
                      setRows(current => current.filter(item => item.id !== row.id))
                      if (isEditing) setEditingId(null)
                    }}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            )
          })
        )}

        <Pagination
          total={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          unitLabel="payers"
          onPageChange={setPage}
          onRowsPerPageChange={next => {
            setRowsPerPage(next)
            setPage(0)
          }}
        />
      </div>
    </section>
  )
}

function StateModal({
  state,
  defaultGroups,
  groupOptions,
  onClose,
  onSave,
}: {
  state: AuthStateConfig | null
  defaultGroups: string[]
  groupOptions: string[]
  onClose: () => void
  onSave: (row: Omit<AuthStateConfig, 'id'>) => void
}) {
  const [color, setColor] = useState(state?.color ?? DEFAULT_NEW_STATE_COLOR)
  const [name, setName] = useState(state?.name ?? '')
  const [description, setDescription] = useState(state?.description ?? '')
  const [groups, setGroups] = useState<string[]>(state ? state.groups : defaultGroups)
  const isEditing = Boolean(state)
  const allGroups = groups.length === 0

  const toggleGroup = (group: string) => {
    setGroups(current =>
      current.includes(group) ? current.filter(item => item !== group) : [...current, group],
    )
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = name.trim().length > 0

  const save = () => {
    if (!canSave) return
    onSave({ name: name.trim(), description: description.trim(), color, groups })
  }

  return createPortal(
    <div
      className="create-state-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="create-state-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-state-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="create-state-header">
          <h2 id="create-state-title" className="create-state-title">
            {isEditing ? 'Edit state' : 'Create a new state'}
          </h2>
          <button className="create-state-close" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="create-state-body">
          <div className="create-state-field">
            <span className="create-state-label">Select a color</span>
            <div className="create-state-color-row">
              <label className="create-state-color-btn" style={{ backgroundColor: color }}>
                <input
                  type="color"
                  value={color}
                  aria-label="State color"
                  onChange={event => setColor(event.target.value)}
                />
              </label>
              <div className="create-state-swatches">
                {STATE_COLOR_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`prior-auth-prefs-color-swatch ${
                      color === option ? 'is-selected' : ''
                    }`}
                    style={{ backgroundColor: option }}
                    aria-label={`Use color ${option}`}
                    onClick={() => setColor(option)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="create-state-field">
            <label className="create-state-label" htmlFor="create-state-name">
              State Name
            </label>
            <input
              id="create-state-name"
              className="create-state-input"
              placeholder="Label"
              value={name}
              onChange={event => setName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="create-state-field">
            <label className="create-state-label" htmlFor="create-state-description">
              Description
            </label>
            <input
              id="create-state-description"
              className="create-state-input"
              placeholder="Label"
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
          <div className="create-state-field">
            <span className="create-state-label">Available to</span>
            <div className="create-state-groups">
              <label className="create-state-group-option">
                <input type="checkbox" checked={allGroups} onChange={() => setGroups([])} />
                <span>All groups</span>
              </label>
              {groupOptions.map(group => (
                <label key={group} className="create-state-group-option">
                  <input
                    type="checkbox"
                    checked={groups.includes(group)}
                    onChange={() => toggleGroup(group)}
                  />
                  <span>{group}</span>
                </label>
              ))}
            </div>
            <p className="create-state-hint">
              Pick the groups that work this step. Leave every group unchecked to make the state
              available to everyone.
            </p>
          </div>
        </div>

        <footer className="create-state-footer">
          <button type="button" className="create-state-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="create-state-save" disabled={!canSave} onClick={save}>
            Save
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

function StateConfigurationSection() {
  const groupOptions = useAssigneeGroups()
  const [rows, setRows] = useState<AuthStateConfig[]>(loadAuthStateConfig)
  const [scope, setScope] = useState<string>(ALL_GROUPS_SCOPE)
  // undefined keeps the modal closed; null opens it for a brand new state.
  const [modalState, setModalState] = useState<AuthStateConfig | null | undefined>(undefined)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    saveAuthStateConfig(rows)
  }, [rows])

  // A group sees its own states plus every shared one, which is what its queue offers.
  const scopedRows = useMemo(
    () =>
      scope === ALL_GROUPS_SCOPE
        ? rows
        : rows.filter(row => row.groups.length === 0 || row.groups.includes(scope)),
    [rows, scope],
  )

  const lastPage = Math.max(0, Math.ceil(scopedRows.length / rowsPerPage) - 1)
  const safePage = Math.min(page, lastPage)
  const visibleRows = useMemo(
    () => scopedRows.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage),
    [scopedRows, safePage, rowsPerPage],
  )

  const saveState = (values: Omit<AuthStateConfig, 'id'>) => {
    if (modalState) {
      setRows(current => current.map(row => (row.id === modalState.id ? { ...row, ...values } : row)))
    } else {
      setRows(current => [...current, { id: `state-${Date.now()}`, ...values }])
      setPage(Math.floor(scopedRows.length / rowsPerPage))
    }
    setModalState(undefined)
  }

  const moveRow = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    setRows(current => {
      const from = current.findIndex(row => row.id === sourceId)
      const to = current.findIndex(row => row.id === targetId)
      if (from === -1 || to === -1) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <section className="prior-auth-prefs-section">
      <div className="prior-auth-prefs-section-header">
        <div className="prior-auth-prefs-section-copy">
          <h2 className="prior-auth-prefs-section-title">State Configuration</h2>
          <p className="prior-auth-prefs-section-description">
            States can be created to help you identify how to manage an authorization in its
            journey. For example you can add a state “Authorized” to identify that the patient has
            received authorization from the payer and that it no longer needs further engagement.
            A state can be available to everyone or only to the user groups that work that step,
            so an authorization only offers the states its assignee’s group uses.
          </p>
        </div>
        <button className="prior-auth-prefs-add-btn" onClick={() => setModalState(null)}>
          + State
        </button>
      </div>

      <div className="prior-auth-prefs-scope">
        <label htmlFor="state-scope">Show states for</label>
        <select
          id="state-scope"
          className="prior-auth-prefs-scope-select"
          value={scope}
          onChange={event => {
            setScope(event.target.value)
            setPage(0)
          }}
        >
          <option value={ALL_GROUPS_SCOPE}>All groups</option>
          {groupOptions.map(group => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        {scope === ALL_GROUPS_SCOPE ? null : (
          <span className="prior-auth-prefs-scope-hint">
            Shared states plus the ones only {scope} uses
          </span>
        )}
      </div>

      <div className="prior-auth-prefs-table">
        <div className="prior-auth-prefs-row is-header">
          <div className="prior-auth-prefs-cell col-handle" />
          <div className="prior-auth-prefs-cell col-state-name">State Name</div>
          <div className="prior-auth-prefs-cell col-state-description">Description</div>
          <div className="prior-auth-prefs-cell col-state-groups">Available To</div>
          <div className="prior-auth-prefs-cell col-color">Color</div>
          <div className="prior-auth-prefs-cell col-row-actions" />
        </div>

        {visibleRows.length === 0 ? (
          <div className="prior-auth-prefs-empty">No states configured yet.</div>
        ) : (
          visibleRows.map(row => {
            const rowClasses = [
              'prior-auth-prefs-row',
              draggingId === row.id ? 'is-dragging' : '',
              dropTargetId === row.id ? 'is-drop-target' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={row.id}
                className={rowClasses}
                draggable={draggingId === row.id}
                onDragOver={event => {
                  if (!draggingId) return
                  event.preventDefault()
                  setDropTargetId(row.id)
                }}
                onDrop={event => {
                  if (!draggingId) return
                  event.preventDefault()
                  moveRow(draggingId, row.id)
                  setDraggingId(null)
                  setDropTargetId(null)
                }}
                onDragEnd={() => {
                  setDraggingId(null)
                  setDropTargetId(null)
                }}
              >
                <div className="prior-auth-prefs-cell col-handle">
                  <button
                    className="prior-auth-prefs-drag-handle"
                    aria-label={`Reorder ${row.name || 'state'}`}
                    onMouseDown={() => setDraggingId(row.id)}
                  >
                    <DragHandleIcon />
                  </button>
                </div>
                <div className="prior-auth-prefs-cell col-state-name">
                  <span className="prior-auth-prefs-truncate">{row.name}</span>
                </div>
                <div className="prior-auth-prefs-cell col-state-description">
                  <span className="prior-auth-prefs-truncate">{row.description}</span>
                </div>
                <div className="prior-auth-prefs-cell col-state-groups">
                  {row.groups.length === 0 ? (
                    <span className="prior-auth-prefs-chip is-muted">All groups</span>
                  ) : (
                    <div className="prior-auth-prefs-chip-row">
                      {row.groups.slice(0, 1).map(group => (
                        <span key={group} className="prior-auth-prefs-chip" title={group}>
                          {group}
                        </span>
                      ))}
                      {row.groups.length > 1 ? (
                        <span className="prior-auth-prefs-chip" title={row.groups.join(', ')}>
                          +{row.groups.length - 1}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="prior-auth-prefs-cell col-color">
                  <span
                    className="prior-auth-prefs-color-dot"
                    style={{ backgroundColor: row.color }}
                  />
                </div>
                <div className="prior-auth-prefs-cell col-row-actions">
                  <button
                    className="prior-auth-prefs-icon-btn"
                    aria-label={`Edit ${row.name}`}
                    onClick={() => setModalState(row)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="prior-auth-prefs-icon-btn"
                    aria-label={`Delete ${row.name}`}
                    onClick={() => setRows(current => current.filter(item => item.id !== row.id))}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            )
          })
        )}

        <Pagination
          total={scopedRows.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          unitLabel="states"
          onPageChange={setPage}
          onRowsPerPageChange={next => {
            setRowsPerPage(next)
            setPage(0)
          }}
        />
      </div>
      {modalState !== undefined ? (
        <StateModal
          state={modalState}
          defaultGroups={scope === ALL_GROUPS_SCOPE ? [] : [scope]}
          groupOptions={groupOptions}
          onClose={() => setModalState(undefined)}
          onSave={saveState}
        />
      ) : null}
    </section>
  )
}

export default function PriorAuthPreferences() {
  return (
    <div className="prior-auth-prefs-page">
      <PayerPortalSection />
      <StateConfigurationSection />
    </div>
  )
}

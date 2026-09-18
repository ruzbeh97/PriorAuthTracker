import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ASSIGNEE_INDIVIDUALS, loadUserGroups, saveUserGroups, type UserGroup } from '../../assignees'
import './UserGroupsPreferences.css'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

function CreateUserGroupDrawer({
  group,
  onClose,
  onSave,
}: {
  group: UserGroup | null
  onClose: () => void
  onSave: (values: Omit<UserGroup, 'id'>) => void
}) {
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [members, setMembers] = useState<string[]>(group?.members ?? [])
  const [membersOpen, setMembersOpen] = useState(false)
  const isEditing = Boolean(group)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleMember = (user: string) => {
    setMembers(current =>
      current.includes(user) ? current.filter(item => item !== user) : [...current, user],
    )
  }

  const canSave = name.trim().length > 0

  return createPortal(
    <div
      className="user-group-drawer-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        className="user-group-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-group-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="user-group-drawer-header">
          <h2 id="create-user-group-title" className="user-group-drawer-title">
            {isEditing ? 'Edit User Group' : 'Create User Group'}
          </h2>
          <button className="user-group-drawer-close" aria-label="Close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="user-group-drawer-body">
          <div className="user-group-field">
            <span className="user-group-field-label">Group Name</span>
            <div className="user-group-field-box">
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Enter group name"
                autoFocus
              />
            </div>
          </div>

          <div className="user-group-field">
            <span className="user-group-field-label">Description</span>
            <div className="user-group-field-box">
              <input
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Enter group description (optional)"
              />
            </div>
          </div>

          <div className="user-group-field">
            <span className="user-group-field-label">Members</span>
            <div className={`user-group-field-box ${membersOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="user-group-members-trigger"
                onClick={() => setMembersOpen(open => !open)}
              >
                {members.length ? (
                  <span className="user-group-members-value">
                    {members.map(member => (
                      <span key={member} className="user-group-member-chip">
                        {member}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="user-group-members-placeholder">Select users to add</span>
                )}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="#8c8c8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {membersOpen ? (
              <div className="user-group-members-menu" role="listbox">
                {ASSIGNEE_INDIVIDUALS.map(user => (
                  <button
                    key={user}
                    type="button"
                    className={`user-group-members-option ${members.includes(user) ? 'is-selected' : ''}`}
                    onClick={() => toggleMember(user)}
                  >
                    {user}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="user-group-drawer-footer">
          <button
            type="button"
            className="user-group-create"
            disabled={!canSave}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), members })}
          >
            {isEditing ? 'Save' : 'Create'}
          </button>
          <button type="button" className="user-group-cancel" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}

export default function UserGroupsPreferences() {
  const [groups, setGroups] = useState<UserGroup[]>(loadUserGroups)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [drawerGroup, setDrawerGroup] = useState<UserGroup | null | undefined>(undefined)

  useEffect(() => {
    saveUserGroups(groups)
  }, [groups])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return groups
    return groups.filter(group =>
      [group.name, group.description, ...group.members].some(value =>
        value.toLowerCase().includes(needle),
      ),
    )
  }, [groups, query])

  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1)
  const safePage = Math.min(page, lastPage)
  const visible = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage)
  const first = filtered.length === 0 ? 0 : safePage * rowsPerPage + 1
  const last = Math.min(filtered.length, (safePage + 1) * rowsPerPage)

  const saveGroup = (values: Omit<UserGroup, 'id'>) => {
    if (drawerGroup) {
      setGroups(current =>
        current.map(group => (group.id === drawerGroup.id ? { ...group, ...values } : group)),
      )
    } else {
      setGroups(current => [...current, { id: `group-${Date.now()}`, ...values }])
    }
    setDrawerGroup(undefined)
  }

  return (
    <div className="user-groups-page">
      <div className="user-groups-header">
        <h1 className="user-groups-title">User Groups</h1>
        <div className="user-groups-header-actions">
          <div className="user-groups-search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(0)
              }}
              placeholder="Search"
            />
          </div>
          <button className="user-groups-create-btn" onClick={() => setDrawerGroup(null)}>
            + Create Group
          </button>
        </div>
      </div>

      <div className="user-groups-table">
        <div className="user-groups-row is-header">
          <div className="user-groups-cell col-actions" />
          <div className="user-groups-cell col-name">Name</div>
          <div className="user-groups-cell col-description">Description</div>
          <div className="user-groups-cell col-members">Members</div>
        </div>

        {visible.length === 0 ? (
          <div className="user-groups-empty">No user groups found.</div>
        ) : (
          visible.map(group => (
            <div key={group.id} className="user-groups-row">
              <div className="user-groups-cell col-actions">
                <button
                  className="user-groups-icon-btn"
                  aria-label={`Edit ${group.name}`}
                  onClick={() => setDrawerGroup(group)}
                >
                  <PencilIcon />
                </button>
                <button
                  className="user-groups-icon-btn"
                  aria-label={`Delete ${group.name}`}
                  onClick={() => setGroups(current => current.filter(item => item.id !== group.id))}
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="user-groups-cell col-name">
                <span className="user-groups-truncate">{group.name}</span>
              </div>
              <div className="user-groups-cell col-description">
                <span className="user-groups-truncate">{group.description || '—'}</span>
              </div>
              <div className="user-groups-cell col-members">
                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="user-groups-pagination">
        <div className="user-groups-pagination-group">
          <span>Rows per page:</span>
          <select
            className="user-groups-rows-select"
            value={rowsPerPage}
            aria-label="Rows per page"
            onChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="user-groups-pagination-group">
          <span>
            {first}–{last} of {filtered.length}
          </span>
          <button
            className="user-groups-page-btn"
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            ‹
          </button>
          <button
            className="user-groups-page-btn"
            aria-label="Next page"
            disabled={safePage >= lastPage}
            onClick={() => setPage(safePage + 1)}
          >
            ›
          </button>
        </div>
      </div>

      {drawerGroup !== undefined ? (
        <CreateUserGroupDrawer
          group={drawerGroup}
          onClose={() => setDrawerGroup(undefined)}
          onSave={saveGroup}
        />
      ) : null}
    </div>
  )
}

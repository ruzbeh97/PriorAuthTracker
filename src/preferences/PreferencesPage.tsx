import { useEffect, useState } from 'react'
import PreferencesSidebar, { type PreferenceItem } from './components/PreferencesSidebar'
import TextSnippetsTable, { type TableRow } from './components/TextSnippetsTable'
import AddTextSnippetPage from './components/AddTextSnippetPage'
import PriorAuthPreferences from './components/PriorAuthPreferences'
import UserGroupsPreferences from './components/UserGroupsPreferences'
import { clearSnippetDraft, loadSnippetDraft } from './utils/snippetDraft'
import { SNIPPETS_STORAGE_KEY, ensureSnippetsSeeded } from './utils/seedSnippets'
import './preferences-embed.css'

type View = 'table' | 'add' | 'edit'

const initialDraft = loadSnippetDraft()
const initialView: View =
  initialDraft?.view === 'add' || initialDraft?.view === 'edit' ? initialDraft.view : 'table'
const initialEditingRowId =
  initialDraft?.view === 'edit' ? initialDraft.editingRowId : null

function loadSavedRows(): TableRow[] {
  return ensureSnippetsSeeded()
}

function saveRows(rows: TableRow[]) {
  try {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(rows))
  } catch {
    /* ignore quota errors */
  }
}

export default function PreferencesPage() {
  const [view, setView] = useState<View>(initialView)
  const [rows, setRows] = useState<TableRow[]>(loadSavedRows)
  const [editingRowId, setEditingRowId] = useState<string | null>(initialEditingRowId)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeItem, setActiveItem] = useState<PreferenceItem>('Text Snippets')
  // Only the session that was interrupted by a refresh may be restored from the draft.
  // Once the editor is left, the draft is stale and must not be replayed over a saved row.
  const [editorDraft, setEditorDraft] = useState(() => initialDraft)

  const discardDraft = () => {
    clearSnippetDraft()
    setEditorDraft(null)
  }

  // Mirror every row change into storage so snippets survive a refresh no matter which
  // path changed them (save, duplicate, delete, reorder).
  useEffect(() => {
    saveRows(rows)
  }, [rows])

  const persistRows = (next: TableRow[]) => {
    setRows(next)
    saveRows(next)
  }

  const editingRow = editingRowId ? rows.find(r => r.id === editingRowId) : undefined

  const handleSave = (newRow: TableRow) => {
    if (editingRowId) {
      persistRows(rows.map(r => (r.id === editingRowId ? { ...newRow, id: editingRowId } : r)))
      setEditingRowId(null)
    } else {
      persistRows([...rows, { ...newRow, id: Date.now().toString() }])
    }
    discardDraft()
    setView('table')
  }

  const handleSaveAndCreateAnother = (newRow: TableRow) => {
    if (editingRowId) {
      persistRows(rows.map(r => (r.id === editingRowId ? { ...newRow, id: editingRowId } : r)))
      setEditingRowId(null)
    } else {
      persistRows([...rows, { ...newRow, id: Date.now().toString() }])
    }
    discardDraft()
    setView('table')
    setTimeout(() => setView('add'), 0)
  }

  const handleEdit = (rowId: string) => {
    discardDraft()
    setEditingRowId(rowId)
    setView('edit')
  }

  const handleDuplicate = (rowId: string) => {
    const row = rows.find(r => r.id === rowId)
    if (row) persistRows([...rows, { ...row, id: Date.now().toString() }])
  }

  const handleDelete = (rowId: string) => {
    persistRows(rows.filter(r => r.id !== rowId))
  }

  const snippetContent =
    view === 'table' ? (
      <TextSnippetsTable
        onAddClick={() => {
          discardDraft()
          setEditingRowId(null)
          setView('add')
        }}
        rows={rows}
        onRowsChange={persistRows}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    ) : (
      <AddTextSnippetPage
        key={view === 'edit' ? editingRowId ?? 'edit' : 'new'}
        onBack={() => {
          discardDraft()
          setEditingRowId(null)
          setView('table')
        }}
        onSave={handleSave}
        onSaveAndCreateAnother={handleSaveAndCreateAnother}
        editingRow={editingRow}
        editingRowId={editingRowId}
        isPreferencesOpen={isSidebarOpen}
        onOpenPreferences={() => setIsSidebarOpen(true)}
        initialDraft={editorDraft}
      />
    )

  const mainContent =
    activeItem === 'Prior Authorization Tracker' ? (
      <PriorAuthPreferences />
    ) : activeItem === 'User Groups' ? (
      <UserGroupsPreferences />
    ) : (
      snippetContent
    )

  return (
    <div className="prefs-embed">
      {isSidebarOpen && (
        <PreferencesSidebar
          onClose={() => setIsSidebarOpen(false)}
          activeItem={activeItem}
          onSelect={setActiveItem}
        />
      )}
      <div className="prefs-embed-main">{mainContent}</div>
    </div>
  )
}

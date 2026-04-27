import { useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Scorecards from './components/Scorecards';
import Toolbar from './components/Toolbar';
import { applyFilters, countActiveFilters, EMPTY_FILTERS } from './components/FilterPanel';
import type { Filters } from './components/FilterPanel';
import AuthTable from './components/AuthTable';
import BulkActions from './components/BulkActions';
import Pagination from './components/Pagination';
import NotesModal from './components/NotesModal';
import CreateAuthDrawer from './components/CreateAuthDrawer';
import type { CreateAuthForm } from './components/CreateAuthDrawer';
import AuthDetailPanel from './components/AuthDetailPanel';
import PriorAuthTracker2 from './components/PriorAuthTracker2';
import { mockAuthRecords } from './data';
import type { AuthRecord, AuthState, TimelineEntry } from './types';

export default function App() {
  const [records, setRecords] = useState<AuthRecord[]>(mockAuthRecords);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pre-certs' | 'referrals'>('pre-certs');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [notesRecordId, setNotesRecordId] = useState<string | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Prior Auth Tracker 1');
  const [detailHeaderInfo, setDetailHeaderInfo] = useState<{ patientName: string; authNumber: string; index: number; total: number } | null>(null);
  const navigateRecordRef = useRef<((dir: 'prev' | 'next') => void) | null>(null);
  const clearSelectionRef = useRef<(() => void) | null>(null);

  const filteredRecords = useMemo(() => applyFilters(records, filters), [records, filters]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredRecords.length) return new Set();
      return new Set(filteredRecords.map((r) => r.id));
    });
  }, [filteredRecords]);

  const handleToggleExpand = useCallback((patientKey: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientKey)) next.delete(patientKey);
      else next.add(patientKey);
      return next;
    });
  }, []);

  const handleStateChange = useCallback((id: string, state: AuthState) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, state } : r))
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkAssignOwner = useCallback((owner: string) => {
    setRecords((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, assignedTo: owner } : r))
    );
  }, [selectedIds]);

  const handleBulkChangeState = useCallback((state: AuthState) => {
    setRecords((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, state } : r))
    );
  }, [selectedIds]);

  const handleBulkAddTags = useCallback((tags: string[]) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (!selectedIds.has(r.id)) return r;
        const merged = [...new Set([...r.tags, ...tags])];
        return { ...r, tags: merged };
      })
    );
  }, [selectedIds]);

  const handleBulkAddNote = useCallback((text: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (!selectedIds.has(r.id)) return r;
        return {
          ...r,
          notes: [
            ...r.notes,
            { id: `n${Date.now()}-${r.id}`, text, author: 'Adam Smith', timestamp: new Date().toISOString() },
          ],
        };
      })
    );
  }, [selectedIds]);

  const handleBulkArchive = useCallback(() => {
    setRecords((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, state: 'Archived' as AuthState } : r))
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkDelete = useCallback(() => {
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleArchive = useCallback((recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, state: 'Archived' as AuthState } : r))
    );
    if (detailRecordId === recordId) setDetailRecordId(null);
  }, [detailRecordId]);

  const handleAddNote = useCallback((recordId: string, text: string) => {
    const now = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const entry: TimelineEntry = {
          id: `tl-${Date.now()}`,
          timestamp: now,
          author: 'Adam Smith',
          action: { kind: 'note_added', text },
        };
        return {
          ...r,
          notes: [
            ...r.notes,
            { id: `n${Date.now()}`, text, author: 'Adam Smith', timestamp: now },
          ],
          timeline: [...(r.timeline || []), entry],
        };
      })
    );
  }, []);

  const handleDeleteNote = useCallback((recordId: string, noteId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        return { ...r, notes: r.notes.filter((n) => n.id !== noteId) };
      })
    );
  }, []);

  const handleCreateAuth = useCallback((form: CreateAuthForm) => {
    const newRecord: AuthRecord = {
      id: `new-${Date.now()}`,
      patient: {
        name: form.patient || 'New Patient',
        dob: '',
      },
      authNumber: form.authorizationNumber,
      payer: { name: form.payer, planId: form.payerId },
      startDate: form.startDate ? new Date(form.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '',
      endDate: form.endDate ? new Date(form.endDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '',
      visitsAuthorized: parseInt(form.visitsAuthorized) || 0,
      visitsCompleted: 0,
      visitsScheduled: 0,
      state: 'Not Started',
      status: form.authorizationNumber ? 'Active' : 'Needs Auth',
      facility: form.facility,
      provider: form.provider,
      assignedTo: form.assignedTo,
      tags: form.tags ? [form.tags] : [],
      notes: form.notes
        ? [{ id: `n${Date.now()}`, text: form.notes, author: 'Adam Smith', timestamp: new Date().toISOString() }]
        : [],
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  const handleReassignVisit = useCallback((
    fromRecordId: string,
    toAuthNumber: string,
    type: 'completed' | 'scheduled',
    apptDateTime?: string,
  ) => {
    const now = new Date().toISOString();
    setRecords((prev) => {
      const fromRecord = prev.find((r) => r.id === fromRecordId);
      if (!fromRecord) return prev;

      const toRecord = prev.find((r) =>
        r.patient.name === fromRecord.patient.name &&
        r.patient.dob === fromRecord.patient.dob &&
        (toAuthNumber === '--' ? !r.authNumber : r.authNumber === toAuthNumber) &&
        r.id !== fromRecordId
      );
      if (!toRecord) return prev;

      const fromAuth = fromRecord.authNumber || '--';
      const fromEntry: TimelineEntry = {
        id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        author: 'Adam Smith',
        action: {
          kind: 'appointment_moved',
          apptDateTime: apptDateTime || 'Unknown',
          apptType: type,
          fromAuth,
          toAuth: toAuthNumber,
        },
      };
      const toEntry: TimelineEntry = {
        id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}r`,
        timestamp: now,
        author: 'Adam Smith',
        action: {
          kind: 'appointment_moved',
          apptDateTime: apptDateTime || 'Unknown',
          apptType: type,
          fromAuth,
          toAuth: toAuthNumber,
        },
      };

      return prev.map((r) => {
        if (r.id === fromRecordId) {
          return {
            ...r,
            ...(type === 'completed'
              ? { visitsCompleted: Math.max(0, r.visitsCompleted - 1) }
              : { visitsScheduled: Math.max(0, r.visitsScheduled - 1) }),
            timeline: [...(r.timeline || []), fromEntry],
          };
        }
        if (r.id === toRecord.id) {
          return {
            ...r,
            ...(type === 'completed'
              ? { visitsCompleted: r.visitsCompleted + 1 }
              : { visitsScheduled: r.visitsScheduled + 1 }),
            timeline: [...(r.timeline || []), toEntry],
          };
        }
        return r;
      });
    });
  }, []);

  const handleDetailChange = useCallback((recordId: string, field: string, from: string, to: string) => {
    const now = new Date().toISOString();
    const entry: TimelineEntry = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      author: 'Adam Smith',
      action: { kind: 'detail_changed', field, from, to },
    };
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updated = { ...r, timeline: [...(r.timeline || []), entry] };
        switch (field) {
          case 'Authorization Number': updated.authNumber = to; break;
          case 'Assigned To': updated.assignedTo = to; break;
          case 'Provider': updated.provider = to; break;
          case 'Facility': updated.facility = to; break;
          case 'Start Date': updated.startDate = to; break;
          case 'End Date': updated.endDate = to; break;
          case 'Payer': updated.payer = { ...r.payer, name: to }; break;
        }
        return updated;
      })
    );
  }, []);

  const startIdx = (page - 1) * rowsPerPage;
  const paginatedRecords = filteredRecords.slice(startIdx, startIdx + rowsPerPage);
  const notesRecord = notesRecordId ? records.find((r) => r.id === notesRecordId) : null;
  const detailRecord = detailRecordId ? records.find((r) => r.id === detailRecordId) : null;
  const activeFilterCount = countActiveFilters(filters);
  const allOwners = useMemo(() => [...new Set(records.map((r) => r.assignedTo).filter(Boolean))].sort(), [records]);
  const allTags = useMemo(() => [...new Set(records.flatMap((r) => r.tags))].sort(), [records]);

  return (
    <div className="flex h-screen bg-surface-variant overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} activePage={activePage} onPageChange={setActivePage} />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          detailHeaderInfo={activePage === 'Prior Auth Tracker 2' ? detailHeaderInfo : null}
          onNavigateRecord={(dir) => navigateRecordRef.current?.(dir)}
          onBackToTable={() => clearSelectionRef.current?.()}
        />
        <div className="flex flex-1 min-h-0">
          {activePage === 'Prior Auth Tracker 2' ? (
            <PriorAuthTracker2
              onSelectedRecordChange={(record, index, total) => {
                setDetailHeaderInfo(record ? { patientName: record.patient.name, authNumber: record.authNumber || '---', index, total } : null);
              }}
              registerNavigate={(fn) => { navigateRecordRef.current = fn; }}
              registerClearSelection={(fn) => { clearSelectionRef.current = fn; }}
            />
          ) : (
          <>
          <main className="flex flex-col flex-1 min-w-0 min-h-0 bg-white relative overflow-hidden transition-all duration-200">
            <Scorecards records={filteredRecords} />
            <Toolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCreateAuth={() => setCreateDrawerOpen(true)}
              filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((o) => !o)}
              activeFilterCount={activeFilterCount}
              records={records}
              filters={filters}
              onFiltersChange={(f) => { setFilters(f); setPage(1); }}
            />
            <AuthTable
              records={paginatedRecords}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              expandedPatients={expandedPatients}
              onToggleExpand={handleToggleExpand}
              onStateChange={handleStateChange}
              onNotesClick={setNotesRecordId}
              onRowClick={(id) => setDetailRecordId((prev) => prev === id ? null : id)}
              onArchive={handleArchive}
              activeRecordId={detailRecordId}
            />
            <BulkActions
              selectedCount={selectedIds.size}
              onClear={handleClearSelection}
              onAssignOwner={handleBulkAssignOwner}
              onChangeState={handleBulkChangeState}
              onAddTags={handleBulkAddTags}
              onAddNote={handleBulkAddNote}
              onArchive={handleBulkArchive}
              onDelete={handleBulkDelete}
              owners={allOwners}
              allTags={allTags}
            />
            <Pagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalRecords={filteredRecords.length}
              onPageChange={setPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setPage(1);
              }}
            />
          </main>

          {createDrawerOpen && (
            <CreateAuthDrawer
              open={createDrawerOpen}
              onClose={() => setCreateDrawerOpen(false)}
              onCreate={handleCreateAuth}
            />
          )}
          {!createDrawerOpen && detailRecord && (
            <AuthDetailPanel
              record={detailRecord}
              allRecords={records}
              onClose={() => setDetailRecordId(null)}
              onReassignVisit={handleReassignVisit}
              onDetailChange={handleDetailChange}
            />
          )}
          </>
          )}
        </div>
      </div>

      {notesRecord && (
        <NotesModal
          patientName={notesRecord.patient.name}
          authNumber={notesRecord.authNumber}
          notes={notesRecord.notes}
          onAddNote={(text) => handleAddNote(notesRecord.id, text)}
          onDeleteNote={(noteId) => handleDeleteNote(notesRecord.id, noteId)}
          onClose={() => setNotesRecordId(null)}
        />
      )}
    </div>
  );
}

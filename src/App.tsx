import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Scorecards from './components/Scorecards';
import Toolbar from './components/Toolbar';
import AuthTable from './components/AuthTable';
import BulkActions from './components/BulkActions';
import Pagination from './components/Pagination';
import { mockAuthRecords } from './data';
import type { AuthRecord, AuthState } from './types';

export default function App() {
  const [records, setRecords] = useState<AuthRecord[]>(mockAuthRecords);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pre-certs' | 'referrals'>('pre-certs');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      if (prev.size === records.length) return new Set();
      return new Set(records.map((r) => r.id));
    });
  }, [records]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleStateChange = useCallback((id: string, state: AuthState) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, state } : r))
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const startIdx = (page - 1) * rowsPerPage;
  const paginatedRecords = records.slice(startIdx, startIdx + rowsPerPage);

  return (
    <div className="flex h-screen bg-surface-variant overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header />
        <main className="flex flex-col flex-1 min-h-0 bg-white relative">
          <Scorecards />
          <Toolbar activeTab={activeTab} onTabChange={setActiveTab} />
          <AuthTable
            records={paginatedRecords}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            expandedId={expandedId}
            onToggleExpand={handleToggleExpand}
            onStateChange={handleStateChange}
          />
          <BulkActions selectedCount={selectedIds.size} onClear={handleClearSelection} />
          <Pagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRecords={records.length}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(1);
            }}
          />
        </main>
      </div>
    </div>
  );
}

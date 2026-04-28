import { Download, ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { AuthRecord } from '../types';
import type { Filters } from './FilterPanel';
import FilterDropdown from './FilterDropdown';

interface ToolbarProps {
  activeTab: 'pre-certs' | 'referrals';
  onTabChange: (tab: 'pre-certs' | 'referrals') => void;
  onCreateAuth: () => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
  activeFilterCount: number;
  records: AuthRecord[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function Toolbar({ activeTab, onTabChange, onCreateAuth, filterOpen, onToggleFilter, activeFilterCount, records, filters, onFiltersChange }: ToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-4 bg-white">
        <div className="flex flex-wrap gap-y-3 items-center min-w-0">
          <div className="relative">
            <button
              onClick={onToggleFilter}
              className={`inline-flex items-center gap-1.5 px-3.5 py-[3px] h-7 rounded-full text-sm font-medium transition-colors ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'border border-primary text-primary hover:bg-primary/5'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold bg-white text-primary">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <FilterDropdown
              open={filterOpen}
              onClose={onToggleFilter}
              records={records}
              filters={filters}
              onChange={onFiltersChange}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <div className="flex items-center">
            <button className="inline-flex items-center gap-1 h-7 pl-3.5 pr-2.5 py-[3px] border border-primary rounded-l-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors whitespace-nowrap">
              <Download className="w-3 h-4 shrink-0" strokeWidth={2} />
              Download Filtered View
            </button>
            <button className="inline-flex items-center justify-center h-7 w-7 border border-primary border-l-0 rounded-r-full text-primary hover:bg-primary/5 transition-colors shrink-0">
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <button
            onClick={onCreateAuth}
            className="inline-flex items-center gap-1 px-3.5 py-[3px] h-7 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-hover transition-colors whitespace-nowrap"
          >
            Create Authorization
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 bg-white">
        <TabItem
          label="Pre-Certifications"
          active={activeTab === 'pre-certs'}
          onClick={() => onTabChange('pre-certs')}
        />
        <TabItem
          label="Referrals"
          active={activeTab === 'referrals'}
          onClick={() => onTabChange('referrals')}
        />
      </div>
    </>
  );
}

function TabItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start pb-2.5 pt-2 px-1.5 text-sm font-medium transition-colors ${
        active
          ? 'text-primary border-b-2 border-primary'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Archive, X, ChevronDown, MessageSquare, Trash2 } from 'lucide-react';
import type { AuthState } from '../types';
import { AUTH_STATES } from '../types';

interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onAssignOwner: (owner: string) => void;
  onChangeState: (state: AuthState) => void;
  onAddTags: (tags: string[]) => void;
  onAddNote: (text: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  owners: string[];
  allTags: string[];
}

type OpenMenu = null | 'owner' | 'state' | 'tags' | 'note' | 'more';

export default function BulkActions({
  selectedCount,
  onClear,
  onAssignOwner,
  onChangeState,
  onAddTags,
  onAddNote,
  onArchive,
  onDelete,
  owners,
  allTags,
}: BulkActionsProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  const toggle = (menu: OpenMenu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-20" ref={containerRef}>
      <div className="flex items-center gap-0 bg-white border border-outline rounded-lg shadow-[0px_4px_16px_rgba(0,0,0,0.12)] px-0 h-[52px]">
        <div className="flex items-center h-full">
          <span className="text-base font-medium text-text-primary px-5 whitespace-nowrap">
            {selectedCount} Selected
          </span>
          <div className="w-px h-9 bg-outline" />
        </div>

        <div className="flex items-center gap-2 px-4">
          {/* Assign Owner */}
          <div className="relative">
            <button
              onClick={() => toggle('owner')}
              className={`inline-flex items-center gap-1 px-3 h-9 rounded border text-sm font-medium transition-colors ${
                openMenu === 'owner'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline text-text-primary hover:bg-surface-variant'
              }`}
            >
              Assign Owner
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2} />
            </button>
            {openMenu === 'owner' && (
              <DropdownList
                items={owners}
                onSelect={(val) => { onAssignOwner(val); setOpenMenu(null); }}
              />
            )}
          </div>

          {/* State */}
          <div className="relative">
            <button
              onClick={() => toggle('state')}
              className={`inline-flex items-center gap-1 px-3 h-9 rounded border text-sm font-medium transition-colors ${
                openMenu === 'state'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline text-text-primary hover:bg-surface-variant'
              }`}
            >
              State
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2} />
            </button>
            {openMenu === 'state' && (
              <DropdownList
                items={AUTH_STATES as unknown as string[]}
                onSelect={(val) => { onChangeState(val as AuthState); setOpenMenu(null); }}
              />
            )}
          </div>

          {/* Tags */}
          <div className="relative">
            <button
              onClick={() => toggle('tags')}
              className={`inline-flex items-center gap-1 px-3 h-9 rounded border text-sm font-medium transition-colors ${
                openMenu === 'tags'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline text-text-primary hover:bg-surface-variant'
              }`}
            >
              Tag(s)
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2} />
            </button>
            {openMenu === 'tags' && (
              <TagPicker tags={allTags} onApply={(tags) => { onAddTags(tags); setOpenMenu(null); }} />
            )}
          </div>

          {/* Add Note */}
          <div className="relative">
            <button
              onClick={() => toggle('note')}
              className={`inline-flex items-center gap-1.5 px-3 h-9 rounded border text-sm font-medium transition-colors ${
                openMenu === 'note'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline text-text-primary hover:bg-surface-variant'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
              Add Note
            </button>
            {openMenu === 'note' && (
              <NoteInput onSubmit={(text) => { onAddNote(text); setOpenMenu(null); }} />
            )}
          </div>

          {/* Archive */}
          <button
            onClick={onArchive}
            className="p-2 rounded hover:bg-surface-variant transition-colors"
            title="Archive selected"
          >
            <Archive className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>

          {/* More */}
          <div className="relative">
            <button
              onClick={() => toggle('more')}
              className={`text-sm font-medium cursor-pointer transition-colors ${
                openMenu === 'more' ? 'text-primary' : 'text-primary hover:underline'
              }`}
            >
              More
            </button>
            {openMenu === 'more' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-outline rounded-lg shadow-lg py-1 min-w-[160px] z-30">
                <button
                  onClick={() => { onDelete(); setOpenMenu(null); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-status-expired hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-9 bg-outline" />
        <div className="flex items-center gap-1 px-3">
          <button onClick={onClear} className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Deselect all">
            <X className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="relative">
          <div className="bg-white border border-outline rounded-t px-2 py-0 text-[11px] text-text-secondary font-medium">
            Bulk Actions
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownList({ items, onSelect }: { items: string[]; onSelect: (val: string) => void }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white border border-outline rounded-lg shadow-lg py-1 min-w-[200px] max-h-[240px] overflow-y-auto z-30">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-surface-variant transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TagPicker({ tags, onApply }: { tags: string[]; onApply: (tags: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white border border-outline rounded-lg shadow-lg p-3 min-w-[220px] z-30">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selected.has(tag)
                ? 'bg-primary text-white'
                : 'bg-surface-variant text-text-primary hover:bg-outline'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <button
        onClick={() => onApply([...selected])}
        disabled={selected.size === 0}
        className="w-full px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Apply to {selected.size > 0 ? `${selected.size} tag${selected.size > 1 ? 's' : ''}` : 'selected'}
      </button>
    </div>
  );
}

function NoteInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white border border-outline rounded-lg shadow-lg p-3 w-[280px] z-30">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Add a note to all selected records..."
        rows={3}
        className="w-full border border-outline rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Note
        </button>
      </div>
    </div>
  );
}

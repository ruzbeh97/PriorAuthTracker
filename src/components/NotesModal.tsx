import { useState, useRef, useEffect } from 'react';
import { X, Trash2, MessageSquare } from 'lucide-react';
import type { NoteEntry } from '../types';

interface NotesModalProps {
  patientName: string;
  authNumber: string;
  notes: NoteEntry[];
  onAddNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function NotesModal({ patientName, authNumber, notes, onAddNote, onDeleteNote, onClose }: NotesModalProps) {
  const [newNote, setNewNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    onAddNote(trimmed);
    setNewNote('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <div>
              <h2 className="text-base font-medium text-text-primary">Activity Notes</h2>
              <p className="text-xs text-text-secondary">{patientName} &middot; {authNumber || 'No Auth #'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
            <X className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>

        {/* New note input */}
        <div className="px-5 pt-4 pb-3 border-b border-outline bg-surface-variant/30">
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm text-text-primary bg-white border border-outline rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-text-secondary/60"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-text-secondary">Ctrl+Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!newNote.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-secondary">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" strokeWidth={1.5} />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="group flex gap-3 py-3 border-b border-outline/60 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">
                      {note.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{note.author}</span>
                      <span className="text-[11px] text-text-secondary">{formatTimestamp(note.timestamp)}</span>
                    </div>
                    <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{note.text}</p>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0 self-start mt-0.5"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-status-expired" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

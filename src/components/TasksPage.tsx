import { Fragment, useMemo, useState, type ReactNode } from 'react';
import CreateTaskDrawer, { formatTaskDueDate } from './CreateTaskDrawer';
import type { CreateTaskForm } from './CreateTaskDrawer';
import { CURRENT_USER, type TaskPriority, type TaskRow, type TaskStatus } from '../tasks';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleCheck,
  ExternalLink,
  Filter,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from 'lucide-react';

type TaskTab = 'mine' | 'group' | 'assigned-by-me' | 'all';

const TABS: Array<{ id: TaskTab; label: string }> = [
  { id: 'mine', label: 'My Tasks' },
  { id: 'group', label: 'Available Group Tasks' },
  { id: 'assigned-by-me', label: 'Assigned by Me' },
  { id: 'all', label: 'All Tasks' },
];

export default function TasksPage({
  tasks,
  onTasksChange,
}: {
  tasks: TaskRow[];
  onTasksChange: (updater: (current: TaskRow[]) => TaskRow[]) => void;
}) {
  const [tab, setTab] = useState<TaskTab>('all');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const visible = useMemo(() => {
    const searched = tasks.filter((task) => {
      if (!query.trim()) return true;
      const haystack = `${task.name} ${task.assignedTo} ${task.patient} ${task.type}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
    switch (tab) {
      case 'mine':
        return searched.filter((task) => task.assignedTo === CURRENT_USER);
      case 'group':
        return searched.filter((task) => task.assigneeKind === 'group');
      case 'assigned-by-me':
        return searched.filter((task) => task.assignedBy === CURRENT_USER);
      default:
        return searched;
    }
  }, [tasks, tab, query]);

  const allSelected = visible.length > 0 && visible.every((task) => selectedIds.has(task.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateTask = (form: CreateTaskForm) => {
    const id = `task-${Date.now()}`;
    onTasksChange((current) => [
      {
        id,
        name: form.title.trim(),
        assignedTo: form.assignee,
        assigneeKind: form.assignmentMode === 'group' ? 'group' : 'person',
        assignedBy: CURRENT_USER,
        patient: form.patients.join(', '),
        priority: form.priority,
        status: form.status,
        dueDate: formatTaskDueDate(form.dueDate),
        type: form.taskType,
        fax: '',
        attachment: form.fileName,
        uploadedFile: Boolean(form.fileName),
      },
      ...current,
    ]);
    setTab('all');
  };

  const deleteTask = (id: string) => {
    onTasksChange((current) => current.filter((task) => task.id !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-outline bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-outline px-4">
          <div className="flex items-center gap-6">
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative h-11 text-sm ${
                    active ? 'font-medium text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-b border-outline px-4 py-2.5">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-text-primary hover:bg-surface-variant"
          >
            <Users className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
            My Groups
          </button>
          <label className="flex h-8 w-[180px] items-center gap-1.5 rounded-md border border-outline bg-white px-2.5">
            <Search className="h-3.5 w-3.5 text-text-secondary" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks"
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-disabled-2 focus:outline-none"
            />
          </label>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md border border-outline px-2.5 text-sm text-text-primary hover:bg-surface-variant"
          >
            <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
            Filter
          </button>
          <button
            type="button"
            onClick={() => setCreateDrawerOpen(true)}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Task
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1280px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white text-left">
                <th className="w-10 border-b border-outline px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) setSelectedIds(new Set());
                      else setSelectedIds(new Set(visible.map((task) => task.id)));
                    }}
                    className="h-[18px] w-[18px] cursor-pointer rounded-sm border-2 border-[#666] accent-primary"
                  />
                </th>
                <th className="w-[108px] border-b border-outline px-2 py-2.5" />
                <HeaderCell label="Name" />
                <HeaderCell label="Assigned to" />
                <HeaderCell label="Patient(s)" />
                <HeaderCell label="Priority" />
                <HeaderCell label="Status" />
                <HeaderCell label="Due Date" />
                <HeaderCell label="Type" />
                <HeaderCell label="Fax" />
                <HeaderCell label="Attachment" />
                <HeaderCell label="Uploaded File" />
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => {
                const selected = selectedIds.has(task.id);
                const expanded = expandedIds.has(task.id);
                return (
                  <Fragment key={task.id}>
                    <tr
                      className={`border-b border-outline ${selected ? 'bg-[#f0f4ff]' : 'bg-white hover:bg-[#f7f8ff]'}`}
                    >
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(task.id)}
                          className="h-[18px] w-[18px] cursor-pointer rounded-sm border-2 border-[#666] accent-primary"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 text-[#737373]">
                          <IconButton
                            label={expanded ? 'Collapse task' : 'Expand task'}
                            onClick={() => toggleExpand(task.id)}
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                            )}
                          </IconButton>
                          <IconButton label="Edit task">
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </IconButton>
                          <IconButton label="Delete task" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </IconButton>
                          <IconButton label="Task history">
                            <History className="h-4 w-4" strokeWidth={1.75} />
                          </IconButton>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-text-primary">{task.name}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-text-primary">
                          {task.assigneeKind === 'group' ? (
                            <Users className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                          ) : (
                            <User className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                          )}
                          {task.assignedTo}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-text-primary">{task.patient || '-'}</td>
                      <td className="px-3 py-3">
                        <PriorityBadge value={task.priority} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={task.status} />
                      </td>
                      <td className="px-3 py-3">
                        {task.dueDate ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-text-primary">
                            <CalendarDays className="h-4 w-4 text-[#f48fb1]" strokeWidth={1.75} />
                            {task.dueDate}
                          </span>
                        ) : (
                          <span className="text-sm text-text-primary">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-primary">{task.type || '-'}</td>
                      <td className="px-3 py-3 text-sm text-text-primary">{task.fax || '-'}</td>
                      <td className="px-3 py-3 text-sm text-text-primary">{task.attachment || '-'}</td>
                      <td className="px-3 py-3">
                        {task.uploadedFile ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            Download
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        ) : (
                          <span className="text-sm text-text-primary">-</span>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-outline bg-surface-variant">
                        <td colSpan={12} className="px-14 py-3 text-sm text-text-secondary">
                          Assigned by {task.assignedBy}. {task.type ? `Type: ${task.type}.` : ''}{' '}
                          {task.status === 'Done' ? 'This task is complete.' : 'This task has not been started.'}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <CreateTaskDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreate={handleCreateTask}
      />
    </main>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <th className="border-b border-outline px-3 py-2.5 text-sm font-medium whitespace-nowrap text-text-secondary">
      {label}
    </th>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded p-0.5 hover:bg-black/5"
    >
      {children}
    </button>
  );
}

function PriorityBadge({ value }: { value: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    Urgent: 'bg-[#fde8e8] text-[#c62828]',
    High: 'bg-[#ffe8d6] text-[#c2410c]',
    Medium: 'bg-[#fff4d6] text-[#b45309]',
    Low: 'bg-[#e8f0fe] text-[#5f6368]',
    'No Priority': 'bg-[#f1f1f1] text-[#454545]',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-[18px] ${styles[value]}`}>
      {value}
    </span>
  );
}

function StatusBadge({ value }: { value: TaskStatus }) {
  if (value === 'Done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#1a1a1a]">
        <CircleCheck className="h-3.5 w-3.5 text-[#1e8e3e]" strokeWidth={2} />
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2.5 py-0.5 text-[12px] font-medium leading-[18px] text-[#1a1a1a]">
      <Circle className="h-3.5 w-3.5 text-[#f59e0b]" strokeWidth={2} />
      Not Started
    </span>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore, type TaskStatus, type Priority } from '@/stores/useTaskStore';

const STATUS_FILTERS: { key: TaskStatus | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: '全部', emoji: '📋' },
  { key: 'inbox', label: '收件箱', emoji: '📥' },
  { key: 'todo', label: '待办', emoji: '📌' },
  { key: 'doing', label: '进行中', emoji: '⚡' },
  { key: 'done', label: '已完成', emoji: '✅' },
];

const P_COLORS: Record<Priority, string> = { 0: '#EF4444', 1: '#F59E0B', 2: '#3B82F6', 3: '#A8A29E' };
const P_LABELS: Record<Priority, string> = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3' };

export default function TasksPage() {
  const { tasks, projects, addTask, updateTask, deleteTask, moveTask } = useTaskStore();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: '', description: '', priority: 2 as Priority, projectId: '', dueDate: '' });

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowForm(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const filtered = tasks
    .filter((t) => (filter === 'all' ? t.status !== 'archived' : t.status === filter))
    .sort((a, b) => a.priority - b.priority || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const counts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? tasks.filter((t) => t.status !== 'archived').length : tasks.filter((t) => t.status === f.key).length;
    return acc;
  }, {} as Record<string, number>);

  const submitTask = () => {
    if (!form.title.trim()) return;
    addTask({ title: form.title.trim(), description: form.description, status: 'inbox' as TaskStatus, priority: form.priority, dueDate: form.dueDate || null, estimatedMinutes: null, projectId: form.projectId || null, tags: [], isRecurring: false });
    setForm({ title: '', description: '', priority: 2, projectId: '', dueDate: '' });
    setShowForm(false);
  };

  const startEdit = (id: string, title: string) => { setEditingId(id); setEditTitle(title); };
  const saveEdit = (id: string) => { if (editTitle.trim()) updateTask(id, { title: editTitle.trim() }); setEditingId(null); };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px', color: '#1C1917' }}>任务</h1>
          <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>Ctrl+N 快速添加</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setTimeout(() => inputRef.current?.focus(), 100); }}
          style={fabStyle(showForm)}>
          {showForm ? '✕' : '+'}
        </button>
      </div>

      {/* 新建任务表单 */}
      {showForm && (
        <div style={formCardStyle}>
          <input ref={inputRef} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="任务标题 *" autoFocus
            style={{ fontSize: 16, fontWeight: 600, border: 'none', outline: 'none', padding: '8px 0', color: '#1C1917' }}
            onKeyDown={(e) => { if (e.key === 'Enter') submitTask(); if (e.key === 'Escape') setShowForm(false); }}
          />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）" rows={2}
            style={{ fontSize: 14, border: 'none', outline: 'none', resize: 'none', padding: '4px 0', color: '#78716C', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {([0, 1, 2, 3] as Priority[]).map((p) => (
              <button key={p} onClick={() => setForm({ ...form, priority: p })}
                style={priorityBtnStyle(form.priority === p, P_COLORS[p])}>{P_LABELS[p]}</button>
            ))}
            <span style={{ flex: 1 }} />
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              style={miniInputStyle} />
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              style={miniInputStyle}>
              <option value="">无项目</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </select>
            <button onClick={submitTask} style={submitBtnStyle}>添加</button>
          </div>
        </div>
      )}

      {/* 过滤器 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={filterBtnStyle(filter === f.key)}>
            {f.emoji} {f.label} <CountBadge count={counts[f.key] ?? 0} active={filter === f.key} />
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A8A29E' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>📭</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#78716C', margin: '0 0 4px' }}>
            {filter === 'all' ? '还没有任务' : filter === 'done' ? '还没有完成的任务' : '这里空空如也'}
          </p>
          <p style={{ fontSize: 13, margin: '0 0 16px' }}>
            {filter === 'all' ? '点击右上角 + 或按 Ctrl+N 添加第一个任务' : '继续加油！'}
          </p>
          {filter === 'all' && (
            <button onClick={() => { setShowForm(true); setTimeout(() => inputRef.current?.focus(), 100); }}
              style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              创建任务
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((task) => {
            const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
            const isDone = task.status === 'done';
            const isEditing = editingId === task.id;

            return (
              <div key={task.id}
                style={{ ...taskItemStyle, opacity: isDone ? 0.55 : 1 }}
                onDoubleClick={() => !isDone && startEdit(task.id, task.title)}
              >
                {/* 完成勾选 */}
                <button onClick={() => moveTask(task.id, isDone ? 'todo' : 'done')}
                  style={checkStyle(isDone)} title={isDone ? '取消完成' : '标记完成'}>
                  {isDone ? '✓' : ''}
                </button>

                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input ref={editRef} value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(task.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
                      style={{ fontSize: 14, fontWeight: 500, border: 'none', borderBottom: '2px solid #7C3AED', outline: 'none', padding: '2px 0', width: '100%', color: '#1C1917' }}
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: P_COLORS[task.priority] }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: isDone ? '#A8A29E' : '#1C1917', textDecoration: isDone ? 'line-through' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#A8A29E', flexWrap: 'wrap' }}>
                        {project && <span>{project.icon} {project.name}</span>}
                        {task.dueDate && <span>📅 {task.dueDate}</span>}
                        {task.description && <span style={{ opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{task.description}</span>}
                      </div>
                    </>
                  )}
                </div>

                {/* 标签 */}
                <span style={statusTagStyle(task.status)}>{statusLabel(task.status)}</span>

                {/* 操作菜单 */}
                <select value={task.status} onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                  style={{ fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #E7E5E4', backgroundColor: '#FFF', color: '#78716C', cursor: 'pointer' }}>
                  <option value="inbox">📥</option>
                  <option value="todo">📌</option>
                  <option value="doing">⚡</option>
                  <option value="done">✅</option>
                </select>

                <button onClick={() => { if (confirm('删除任务？')) deleteTask(task.id); }}
                  style={{ border: 'none', backgroundColor: 'transparent', color: '#D6D3D1', cursor: 'pointer', fontSize: 14, padding: 2 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#D6D3D1'; }}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===== 内联函数 ===== */
function statusLabel(s: string): string {
  const m: Record<string, string> = { inbox: '收件箱', todo: '待办', doing: '进行中', done: '完成' };
  return m[s] ?? s;
}

/* ===== 样式 ===== */
const fabStyle = (active: boolean): React.CSSProperties => ({
  width: 42, height: 42, borderRadius: 13, border: 'none',
  backgroundColor: active ? '#EF4444' : '#7C3AED', color: '#FFF',
  fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 200ms ease', boxShadow: active ? 'none' : '0 2px 8px #7C3AED40',
});

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
  border: '1.5px solid #E7E5E4', display: 'flex', flexDirection: 'column', gap: 10,
  animation: 'flow-slide-down 0.2s ease',
};

const priorityBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
  padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer', transition: 'all 150ms ease',
  border: `2px solid ${active ? color : '#E7E5E4'}`,
  backgroundColor: active ? color + '15' : '#FFF', color,
});

const miniInputStyle: React.CSSProperties = {
  fontSize: 13, padding: '5px 8px', borderRadius: 6, border: '1.5px solid #E7E5E4', color: '#292524',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '6px 16px', fontSize: 13, fontWeight: 600, backgroundColor: '#7C3AED', color: '#FFF',
  border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 150ms ease',
};

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 15px', fontSize: 13,
  fontWeight: active ? 600 : 400, borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
  cursor: 'pointer', transition: 'all 150ms ease',
  backgroundColor: active ? '#EDE9FE' : '#F5F5F4', color: active ? '#5B21B6' : '#78716C',
});

const taskItemStyle: React.CSSProperties = {
  backgroundColor: '#FFF', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #E7E5E4',
  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 150ms ease',
  cursor: 'default',
};

const checkStyle = (done: boolean): React.CSSProperties => ({
  width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  border: `2px solid ${done ? '#10B981' : '#D6D3D1'}`,
  backgroundColor: done ? '#10B981' : 'transparent', color: '#FFF', fontSize: 12,
  transition: 'all 150ms ease',
});

const statusTagStyle = (status: string): React.CSSProperties => {
  const m: Record<string, { bg: string; c: string }> = {
    inbox: { bg: '#FEF3C7', c: '#92400E' }, todo: { bg: '#DBEAFE', c: '#1E40AF' },
    doing: { bg: '#EDE9FE', c: '#5B21B6' }, done: { bg: '#D1FAE5', c: '#065F46' },
  };
  const s = m[status] ?? { bg: '#F5F5F4', c: '#78716C' };
  return { fontSize: 11, padding: '2px 8px', borderRadius: 5, backgroundColor: s.bg, color: s.c, fontWeight: 500, flexShrink: 0 };
};

function CountBadge({ count, active }: { count: number; active: boolean }) {
  if (count === 0) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 8,
      backgroundColor: active ? '#C4B5FD' : '#D6D3D1', color: active ? '#5B21B6' : '#78716C',
      minWidth: 18, textAlign: 'center',
    }}>{count}</span>
  );
}

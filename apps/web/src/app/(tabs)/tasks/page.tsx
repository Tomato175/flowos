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
    <div className="animate-enter" style={pageStyle}>
      {/* 头部 */}
      <div style={headerStyle}>
        <div>
          <h1 className="display-medium" style={pageTitleStyle}>任务</h1>
          <p className="caption" style={subtitleStyle}>Ctrl+N 快速添加</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setTimeout(() => inputRef.current?.focus(), 100); }}
          style={fabStyle(showForm)}
          aria-label={showForm ? '关闭' : '新建任务'}
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* 新建任务表单 */}
      {showForm && (
        <div className="animate-enter" style={formSectionStyle}>
          <input
            ref={inputRef}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="任务标题"
            autoFocus
            className="body-large"
            style={inputStyle}
            onKeyDown={(e) => { if (e.key === 'Enter') submitTask(); if (e.key === 'Escape') setShowForm(false); }}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）"
            rows={2}
            className="body-text"
            style={{ ...inputStyle, resize: 'none', minHeight: 40 }}
          />
          <div style={formRowStyle}>
            {([0, 1, 2, 3] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, priority: p })}
                style={priorityBtnStyle(form.priority === p)}
                className="label-text"
              >
                {P_LABELS[p]}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="body-small"
              style={miniInputStyle}
            />
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="body-small"
              style={miniInputStyle}
            >
              <option value="">无项目</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </select>
            <button onClick={submitTask} className="label-text" style={submitBtnStyle}>
              添加
            </button>
          </div>
        </div>
      )}

      {/* 过滤器 */}
      <div style={filterBarStyle}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="body-small"
            style={filterBtnStyle(filter === f.key)}
          >
            {f.emoji} {f.label}
            <CountBadge count={counts[f.key] ?? 0} active={filter === f.key} />
          </button>
        ))}
      </div>

      {/* 分割线 */}
      <div style={dividerStyle} />

      {/* 任务列表 */}
      {filtered.length === 0 ? (
        <div style={emptyStyle}>
          <p className="display-large" style={emptyEmojiStyle}>
            {filter === 'done' ? '🎉' : '📭'}
          </p>
          <p className="heading-3" style={emptyTitleStyle}>
            {filter === 'all' ? '还没有任务' : filter === 'done' ? '还没有完成的任务' : '这里空空如也'}
          </p>
          <p className="body-text" style={emptyDescStyle}>
            {filter === 'all' ? '点击右上角 + 或按 Ctrl+N 添加第一个任务' : '继续加油！'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => { setShowForm(true); setTimeout(() => inputRef.current?.focus(), 100); }}
              style={emptyBtnStyle}
            >
              创建第一个任务
            </button>
          )}
        </div>
      ) : (
        <div style={listStyle}>
          {filtered.map((task, index) => {
            const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
            const isDone = task.status === 'done';
            const isEditing = editingId === task.id;

            return (
              <div
                key={task.id}
                className="stagger-item"
                style={{
                  ...taskItemStyle,
                  opacity: isDone ? 0.5 : 1,
                  animationDelay: `${index * 0.03}s`,
                }}
                onDoubleClick={() => !isDone && startEdit(task.id, task.title)}
              >
                {/* 完成勾选 */}
                <button
                  onClick={() => moveTask(task.id, isDone ? 'todo' : 'done')}
                  style={checkStyle(isDone)}
                  title={isDone ? '取消完成' : '标记完成'}
                >
                  {isDone ? '✓' : ''}
                </button>

                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input
                      ref={editRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(task.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="body-text"
                      style={editInputStyle}
                    />
                  ) : (
                    <>
                      <div style={taskTitleRowStyle}>
                        <span style={priorityDotStyle(task.priority)} />
                        <span className="body-text" style={{
                          color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
                          textDecoration: isDone ? 'line-through' : undefined,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}>
                          {task.title}
                        </span>
                      </div>
                      <div className="caption" style={taskMetaStyle}>
                        {project && <span>{project.icon} {project.name}</span>}
                        {task.dueDate && <span>📅 {task.dueDate}</span>}
                        {task.description && (
                          <span style={{ opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 状态标签 */}
                <span className="caption" style={statusTagStyle(task.status)}>
                  {statusLabel(task.status)}
                </span>

                {/* 快速切换状态 */}
                <select
                  value={task.status}
                  onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                  className="caption"
                  style={statusSelectStyle}
                >
                  <option value="inbox">📥</option>
                  <option value="todo">📌</option>
                  <option value="doing">⚡</option>
                  <option value="done">✅</option>
                </select>

                {/* 删除 */}
                <button
                  onClick={() => { if (confirm('删除任务？')) deleteTask(task.id); }}
                  style={deleteBtnStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#d35d47'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; }}
                  aria-label="删除"
                >
                  ×
                </button>
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

function priorityDotStyle(p: Priority): React.CSSProperties {
  const opacityMap: Record<Priority, number> = { 0: 1, 1: 0.7, 2: 0.45, 3: 0.3 };
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: 'var(--color-primary)',
    opacity: opacityMap[p],
  };
}

/* ===== 样式常量 ===== */

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: 'var(--space-12) var(--space-6) var(--space-16)',
  fontFamily: 'var(--font-body)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 'var(--space-8)',
};

const pageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  margin: 0,
  color: 'var(--color-text)',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  margin: 'var(--space-2) 0 0',
};

const fabStyle = (active: boolean): React.CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: 'var(--radius-full)',
  border: 'none',
  backgroundColor: active ? 'var(--color-text-muted)' : 'var(--color-primary)',
  color: 'var(--color-surface)',
  fontSize: 24,
  fontWeight: 300,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  lineHeight: 1,
  padding: 0,
});

const formSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-8)',
  paddingBottom: 'var(--space-6)',
  borderBottom: '1px solid var(--color-divider)',
};

const inputStyle: React.CSSProperties = {
  fontSize: 'inherit',
  fontWeight: 500,
  border: 'none',
  borderBottom: '1.5px solid var(--color-border)',
  outline: 'none',
  padding: 'var(--space-2) 0',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  width: '100%',
  transition: 'border-color var(--transition-fast) var(--ease-out-quart)',
  borderRadius: 0,
};

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const priorityBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: 'var(--space-1) var(--space-4)',
  fontSize: 'inherit',
  fontWeight: 600,
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  fontFamily: 'inherit',
});

const miniInputStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  borderBottom: '1.5px solid var(--color-border)',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  outline: 'none',
};

const submitBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-6)',
  fontSize: 'inherit',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-surface)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  overflowX: 'auto',
  paddingBottom: 'var(--space-3)',
  scrollbarWidth: 'none',
};

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: 'var(--space-2) var(--space-4)',
  fontSize: 'inherit',
  fontWeight: active ? 600 : 400,
  borderRadius: 'var(--radius-full)',
  border: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
  fontFamily: 'inherit',
});

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: 'var(--color-divider)',
  margin: 'var(--space-3) 0 var(--space-6)',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const taskItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-2)',
  transition: 'background var(--transition-fast) var(--ease-out-quart)',
  cursor: 'default',
  borderBottom: '1px solid var(--color-divider)',
};

const taskTitleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

const taskMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-1)',
  color: 'var(--color-text-muted)',
  flexWrap: 'wrap' as const,
};

const checkStyle = (done: boolean): React.CSSProperties => ({
  width: 22,
  height: 22,
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: done ? '2px solid var(--color-success)' : '2px solid var(--color-border)',
  backgroundColor: done ? 'var(--color-success)' : 'transparent',
  color: 'var(--color-surface)',
  fontSize: 13,
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  padding: 0,
  lineHeight: 1,
});

const statusTagStyle = (status: string): React.CSSProperties => {
  const isPrimary = status === 'doing';
  const isSuccess = status === 'done';
  return {
    fontSize: 'inherit',
    padding: 'var(--space-0) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    backgroundColor: isPrimary
      ? 'var(--color-primary)'
      : isSuccess
        ? 'var(--color-success)'
        : 'var(--color-primary-subtle)',
    color: (isPrimary || isSuccess) ? 'var(--color-surface)' : 'var(--color-text-secondary)',
    fontWeight: 500,
    flexShrink: 0,
  };
};

const statusSelectStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: 'var(--space-0) var(--space-1)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const deleteBtnStyle: React.CSSProperties = {
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 16,
  padding: 'var(--space-1)',
  transition: 'color var(--transition-fast) var(--ease-out-quart)',
  lineHeight: 1,
};

const editInputStyle: React.CSSProperties = {
  fontSize: 'inherit',
  fontWeight: 500,
  border: 'none',
  borderBottom: '2px solid var(--color-primary)',
  outline: 'none',
  padding: 'var(--space-1) 0',
  width: '100%',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
};

/* 空状态 */
const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-20) var(--space-6)',
  color: 'var(--color-text-muted)',
};

const emptyEmojiStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  margin: '0 0 var(--space-6)',
  fontSize: 64,
  lineHeight: 1,
};

const emptyTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-2)',
};

const emptyDescStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  margin: '0 0 var(--space-6)',
};

const emptyBtnStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-8)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-surface)',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'var(--font-body)',
};

function CountBadge({ count, active }: { count: number; active: boolean }) {
  if (count === 0) return null;
  return (
    <span className="caption" style={{
      fontWeight: 600,
      padding: '1px 6px',
      borderRadius: 'var(--radius-full)',
      backgroundColor: active ? 'var(--color-primary)' : 'var(--color-border)',
      color: active ? 'var(--color-surface)' : 'var(--color-text-muted)',
      minWidth: 18,
      textAlign: 'center',
      fontSize: 10,
    }}>
      {count}
    </span>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNoteStore, type Note } from '@/stores/useNoteStore';
import { useTaskStore } from '@/stores/useTaskStore';

const JOURNAL_TEMPLATES = [
  { label: '自由书写', template: '## 今天发生了什么\n\n## 感受\n\n## 明天计划\n' },
  { label: '感恩日记', template: '## 今天感恩的三件事\n1. \n2. \n3. \n\n## 今日感受\n' },
  { label: '复盘模板', template: '## 完成了什么\n\n## 没完成什么\n\n## 学到了什么\n\n## 明天改进\n' },
];

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, pinNote, getJournal } = useNoteStore();
  const { addTask } = useTaskStore();
  const [tab, setTab] = useState<'journal' | 'notes'>('journal');
  const [search, setSearch] = useState('');
  const todayStr = new Date().toISOString().split('T')[0]!;

  // 日记
  const [journalContent, setJournalContent] = useState('');
  const journal = getJournal(todayStr);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    if (journal) {
      setJournalContent(journal.content);
    } else {
      setJournalContent(JOURNAL_TEMPLATES[0]!.template);
    }
  }, [journal]);

  // 自动保存：每30秒 + 页面关闭时
  const doSave = useCallback(() => {
    if (!journalContent.trim()) return;
    if (journal) {
      updateNote(journal.id, { content: journalContent });
    } else {
      addNote({ title: `${todayStr} 日记`, content: journalContent, noteType: 'daily_journal', journalDate: todayStr, tags: ['日记'], isPinned: false, isArchived: false });
    }
  }, [journalContent, journal]);

  // 页面卸载时保存
  useEffect(() => {
    const handleBeforeUnload = () => { doSave(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [doSave]);

  // 30秒自动保存
  useEffect(() => {
    if (!journalContent.trim()) return;
    const timer = setTimeout(() => {
      doSave();
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 30000);
    return () => clearTimeout(timer);
  }, [journalContent]);

  const saveJournal = () => {
    if (!journalContent.trim()) return;
    doSave();
    setSaved(true);
    setToast('保存成功！可在「📔 今日日记」或「📝 笔记本」查看');
    setTimeout(() => { setToast(null); setSaved(false); }, 3000);
  };

  // 笔记列表
  const visible = notes.filter((n) => !n.isArchived && n.noteType !== 'daily_journal');
  const filtered = search ? visible.filter((n) => n.title.includes(search) || n.content.includes(search)) : visible;
  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  return (
    <div className="animate-enter" style={pageStyle}>
      {/* 头部标签切换 */}
      <div style={tabBarStyle}>
        <button
          onClick={() => setTab('journal')}
          className="body-text"
          style={tabBtnStyle(tab === 'journal')}
        >
          今日日记
        </button>
        <button
          onClick={() => setTab('notes')}
          className="body-text"
          style={tabBtnStyle(tab === 'notes')}
        >
          笔记本
        </button>
      </div>

      {/* ===== 日记 ===== */}
      {tab === 'journal' && (
        <div>
          {/* 日期标题 */}
          <div style={journalHeaderStyle}>
            <h1 className="display-medium" style={journalTitleStyle}>今日日记</h1>
            <p className="body-small" style={journalDateStyle}>{todayStr}</p>
          </div>

          {/* 模板选择 */}
          <div style={templateBarStyle}>
            {JOURNAL_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setJournalContent(t.template)}
                className="caption"
                style={templateBtnStyle(journalContent === t.template)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 编辑器 */}
          <textarea
            ref={contentRef}
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            placeholder="开始写今天的日记..."
            className="body-text"
            style={editorStyle}
          />

          {/* 操作栏 */}
          <div style={editorActionsStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <button
                onClick={saveJournal}
                className="label-text"
                style={saveBtnStyle(saved)}
              >
                {saved ? '已保存' : '保存日记'}
              </button>
              {autoSaved && (
                <span className="caption" style={autoSavedStyle}>已自动保存</span>
              )}
            </div>
            <button
              onClick={() => setJournalContent(JOURNAL_TEMPLATES[0]!.template)}
              className="body-small"
              style={clearBtnStyle}
            >
              清空
            </button>
          </div>

          {/* Toast 提示 */}
          {toast && (
            <div className="animate-enter" style={toastStyle}>
              {toast}
            </div>
          )}
        </div>
      )}

      {/* ===== 笔记本 ===== */}
      {tab === 'notes' && (
        <div>
          {/* 搜索与新建 */}
          <div style={notesToolbarStyle}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索笔记..."
              className="body-text"
              style={searchInputStyle}
            />
            <button
              onClick={() => {
                addNote({ title: '新笔记', content: '', noteType: 'note', journalDate: null, tags: [], isPinned: false, isArchived: false });
              }}
              className="label-text"
              style={newNoteBtnStyle}
            >
              + 新建
            </button>
          </div>

          {/* 置顶笔记 */}
          {pinned.length > 0 && (
            <>
              <p className="label-text" style={sectionLabelStyle}>置顶</p>
              {pinned.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onUpdate={(u) => updateNote(n.id, u)}
                  onDelete={() => deleteNote(n.id)}
                  onPin={() => pinNote(n.id)}
                  onConvert={() => { addTask({ title: n.title, description: n.content, status: 'inbox', priority: 2, dueDate: null, estimatedMinutes: null, projectId: null, tags: n.tags, isRecurring: false }); alert('已添加到任务收件箱！'); }}
                />
              ))}
              <div style={dividerStyle} />
            </>
          )}

          {/* 普通笔记 */}
          {unpinned.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onUpdate={(u) => updateNote(n.id, u)}
              onDelete={() => deleteNote(n.id)}
              onPin={() => pinNote(n.id)}
              onConvert={() => { addTask({ title: n.title, description: n.content, status: 'inbox', priority: 2, dueDate: null, estimatedMinutes: null, projectId: null, tags: n.tags, isRecurring: false }); alert('已添加到任务收件箱！'); }}
            />
          ))}

          {filtered.length === 0 && (
            <div style={emptyStyle}>
              <p className="display-large" style={emptyEmojiStyle}>📝</p>
              <p className="heading-3" style={emptyTitleStyle}>
                {search ? '没有匹配的笔记' : '还没有笔记'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==== 子组件 ==== */

function NoteCard({ note, onUpdate, onDelete, onPin, onConvert }: {
  note: Note; onUpdate: (u: Partial<Note>) => void; onDelete: () => void; onPin: () => void; onConvert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);

  // 渲染 Markdown 中的 [[链接]]
  const renderContent = (content: string) => {
    if (!content) return <span className="body-small" style={{ color: 'var(--color-text-muted)' }}>空内容</span>;
    const html = content
      .replace(/\[\[(.+?)\]\]/g, '<span style="color:var(--color-primary);background:var(--color-primary-subtle);padding:0 4px;border-radius:var(--radius-sm);font-size:12px">📎 $1</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div style={noteItemStyle}>
      <div style={noteContentStyle}>
        {note.isPinned && <span style={{ color: 'var(--color-primary)', fontSize: 12, flexShrink: 0 }}>📌</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { onUpdate({ title }); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ title }); setEditing(false); } }}
              autoFocus
              className="body-text"
              style={editTitleStyle}
            />
          ) : (
            <div
              className="body-text"
              style={noteTitleStyle}
              onClick={() => setEditing(true)}
            >
              {note.title || '无标题'}
            </div>
          )}
          {note.tags.length > 0 && (
            <div style={tagsRowStyle}>
              {note.tags.map((t) => (
                <span key={t} className="caption" style={tagBadgeStyle}>{t}</span>
              ))}
            </div>
          )}
          <div
            className="body-small"
            style={notePreviewStyle}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? renderContent(note.content) : <span>{note.content.slice(0, 120)}{note.content.length > 120 ? '...' : ''}</span>}
          </div>
          <span className="caption" style={noteTimeStyle}>
            {new Date(note.updatedAt).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>
      <div style={noteActionsStyle}>
        <button onClick={onPin} style={noteActionBtnStyle} title="置顶">{note.isPinned ? '📌' : '📍'}</button>
        <button onClick={onConvert} style={noteActionBtnStyle} title="转为任务">➡️</button>
        <button onClick={onDelete} style={noteActionBtnStyle} title="删除">×</button>
      </div>
    </div>
  );
}

/* ==== 页面样式 ==== */

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: 'var(--space-12) var(--space-6) var(--space-16)',
  fontFamily: 'var(--font-body)',
};

/* 标签栏 */
const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-10)',
};

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: 'var(--space-2) var(--space-6)',
  fontSize: 'inherit',
  fontWeight: active ? 600 : 400,
  borderRadius: 'var(--radius-full)',
  border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
});

/* 日记页 */
const journalHeaderStyle: React.CSSProperties = {
  marginBottom: 'var(--space-6)',
};

const journalTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  margin: 0,
  color: 'var(--color-text)',
  letterSpacing: '-0.02em',
};

const journalDateStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  margin: 'var(--space-2) 0 0',
};

const templateBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-5)',
};

const templateBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: 'var(--space-1) var(--space-4)',
  fontSize: 'inherit',
  borderRadius: 'var(--radius-full)',
  border: 'none',
  backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
});

const editorStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 360,
  padding: 'var(--space-6)',
  fontSize: 'inherit',
  lineHeight: 1.8,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  resize: 'vertical',
  fontFamily: 'inherit',
  outline: 'none',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  transition: 'border-color var(--transition-fast) var(--ease-out-quart)',
};

const editorActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'var(--space-4)',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
};

const saveBtnStyle = (saved: boolean): React.CSSProperties => ({
  padding: 'var(--space-3) var(--space-8)',
  fontSize: 'inherit',
  fontWeight: 600,
  color: 'var(--color-surface)',
  backgroundColor: saved ? 'var(--color-success)' : 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
});

const autoSavedStyle: React.CSSProperties = {
  color: 'var(--color-success)',
  opacity: 0.8,
};

const clearBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-4)',
  fontSize: 'inherit',
  borderRadius: 'var(--radius-full)',
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 100,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: 'var(--space-3) var(--space-6)',
  fontSize: 13,
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-text)',
  color: 'var(--color-surface)',
  zIndex: 200,
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-body)',
};

/* 笔记本 */
const notesToolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-8)',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: 'var(--space-3) 0',
  fontSize: 'inherit',
  border: 'none',
  borderBottom: '1.5px solid var(--color-border)',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  borderRadius: 0,
  transition: 'border-color var(--transition-fast) var(--ease-out-quart)',
};

const newNoteBtnStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-6)',
  fontSize: 'inherit',
  fontWeight: 600,
  color: 'var(--color-surface)',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const sectionLabelStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  margin: '0 0 var(--space-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: 'var(--color-divider)',
  margin: 'var(--space-6) 0',
};

/* 笔记项目 */
const noteItemStyle: React.CSSProperties = {
  padding: 'var(--space-4) 0',
  borderBottom: '1px solid var(--color-divider)',
  transition: 'background var(--transition-fast) var(--ease-out-quart)',
};

const noteContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
};

const editTitleStyle: React.CSSProperties = {
  fontSize: 'inherit',
  fontWeight: 600,
  border: 'none',
  borderBottom: '2px solid var(--color-primary)',
  outline: 'none',
  width: '100%',
  padding: 'var(--space-1) 0',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  borderRadius: 0,
};

const noteTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const tagsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  marginTop: 'var(--space-1)',
};

const tagBadgeStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: '1px var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
};

const notePreviewStyle: React.CSSProperties = {
  fontSize: 'inherit',
  color: 'var(--color-text-secondary)',
  marginTop: 'var(--space-2)',
  lineHeight: 1.6,
  cursor: 'pointer',
};

const noteTimeStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  display: 'block',
  marginTop: 'var(--space-2)',
};

const noteActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  marginTop: 'var(--space-3)',
};

const noteActionBtnStyle: React.CSSProperties = {
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: 14,
  padding: 'var(--space-1) var(--space-2)',
  color: 'var(--color-text-muted)',
  transition: 'color var(--transition-fast) var(--ease-out-quart)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'inherit',
  lineHeight: 1,
};

/* 空状态 */
const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) var(--space-6)',
};

const emptyEmojiStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  margin: '0 0 var(--space-4)',
  fontSize: 48,
  lineHeight: 1,
};

const emptyTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

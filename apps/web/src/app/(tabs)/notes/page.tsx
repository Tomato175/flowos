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
    setToast('✅ 保存成功！可在「📔 今日日记」或「📝 笔记本」查看');
    setTimeout(() => { setToast(null); setSaved(false); }, 3000);
  };

  // 笔记列表
  const visible = notes.filter((n) => !n.isArchived && n.noteType !== 'daily_journal');
  const filtered = search ? visible.filter((n) => n.title.includes(search) || n.content.includes(search)) : visible;
  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* 头部标签切换 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        <TabBtn active={tab === 'journal'} onClick={() => setTab('journal')}>📔 今日日记</TabBtn>
        <TabBtn active={tab === 'notes'} onClick={() => setTab('notes')}>📝 笔记本</TabBtn>
      </div>

      {/* ===== 日记 ===== */}
      {tab === 'journal' && (
        <div>
          {/* 模板选择 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {JOURNAL_TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => setJournalContent(t.template)}
                style={{
                  padding: '4px 12px', fontSize: 12, borderRadius: 14, border: '1px solid #E7E5E4',
                  backgroundColor: journalContent === t.template ? '#EDE9FE' : '#FFF',
                  color: journalContent === t.template ? '#5B21B6' : '#78716C', cursor: 'pointer',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 编辑器 */}
          <textarea ref={contentRef} value={journalContent} onChange={(e) => setJournalContent(e.target.value)}
            placeholder="开始写今天的日记..."
            style={{
              width: '100%', minHeight: 300, padding: 16, fontSize: 15, lineHeight: 1.7,
              border: '1.5px solid #E7E5E4', borderRadius: 14, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', color: '#292524',
            }}
          />

          {/* 操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={saveJournal}
                style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, color: '#FFF', backgroundColor: saved ? '#10B981' : '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'background 200ms' }}>
                {saved ? '✅ 已保存' : '💾 保存日记'}
              </button>
              {autoSaved && (
                <span style={{ fontSize: 11, color: '#10B981', animation: 'fadeOut 2s' }}>已自动保存</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setJournalContent(JOURNAL_TEMPLATES[0]!.template)}
                style={miniBtnStyle}>清空</button>
            </div>
          </div>

          {/* Toast 提示 */}
          {toast && (
            <div style={{
              position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
              padding: '10px 20px', fontSize: 13, borderRadius: 10,
              backgroundColor: '#1C1917', color: '#FFF', zIndex: 200,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
              animation: 'fadeIn 0.3s ease',
            }}>
              {toast}
            </div>
          )}
        </div>
      )}

      {/* ===== 笔记本 ===== */}
      {tab === 'notes' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索笔记..." style={{
                flex: 1, padding: '10px 14px', fontSize: 14, border: '1.5px solid #E7E5E4', borderRadius: 10, outline: 'none',
              }}
            />
            <button onClick={() => {
              addNote({ title: '新笔记', content: '', noteType: 'note', journalDate: null, tags: [], isPinned: false, isArchived: false });
            }}
              style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              + 新建
            </button>
          </div>

          {/* 置顶笔记 */}
          {pinned.map((n) => <NoteCard key={n.id} note={n} onUpdate={(u) => updateNote(n.id, u)} onDelete={() => deleteNote(n.id)} onPin={() => pinNote(n.id)} onConvert={() => { addTask({ title: n.title, description: n.content, status: 'inbox', priority: 2, dueDate: null, estimatedMinutes: null, projectId: null, tags: n.tags, isRecurring: false }); alert('已添加到任务收件箱！'); }} />)}

          {/* 普通笔记 */}
          {unpinned.map((n) => <NoteCard key={n.id} note={n} onUpdate={(u) => updateNote(n.id, u)} onDelete={() => deleteNote(n.id)} onPin={() => pinNote(n.id)} onConvert={() => { addTask({ title: n.title, description: n.content, status: 'inbox', priority: 2, dueDate: null, estimatedMinutes: null, projectId: null, tags: n.tags, isRecurring: false }); alert('已添加到任务收件箱！'); }} />)}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>📝</p>
              <p style={{ fontSize: 14 }}>{search ? '没有匹配的笔记' : '还没有笔记'}</p>
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
    if (!content) return <span style={{ color: '#A8A29E', fontSize: 13 }}>空内容</span>;
    const html = content
      .replace(/\[\[(.+?)\]\]/g, '<span style="color:#7C3AED;background:#EDE9FE;padding:0 4px;border-radius:4px;font-size:12px">📎 $1</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div style={noteCardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {note.isPinned && <span style={{ color: '#F59E0B', fontSize: 14 }}>📌</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { onUpdate({ title }); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ title }); setEditing(false); } }}
              autoFocus
              style={{ fontSize: 14, fontWeight: 600, border: 'none', borderBottom: '2px solid #7C3AED', outline: 'none', width: '100%', padding: '2px 0' }}
            />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1917', cursor: 'pointer' }}
              onClick={() => setEditing(true)}>
              {note.title || '无标题'}
            </div>
          )}
          {note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {note.tags.map((t) => (
                <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: '#EDE9FE', color: '#7C3AED' }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#78716C', marginTop: 4, lineHeight: 1.5, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? renderContent(note.content) : <span>{note.content.slice(0, 120)}{note.content.length > 120 ? '...' : ''}</span>}
          </div>
          <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 4 }}>
            {new Date(note.updatedAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <button onClick={onPin} style={actionBtnStyle} title="置顶">{note.isPinned ? '📌' : '📍'}</button>
        <button onClick={onConvert} style={actionBtnStyle} title="转为任务">➡️</button>
        <button onClick={onDelete} style={actionBtnStyle} title="删除">🗑</button>
      </div>
    </div>
  );
}

/* ==== 样式 ==== */

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '8px 20px', fontSize: 14, fontWeight: active ? 600 : 400, borderRadius: 10, border: 'none',
        backgroundColor: active ? '#7C3AED' : '#F5F5F4', color: active ? '#FFF' : '#78716C',
        cursor: 'pointer', transition: 'all 150ms ease',
      }}>
      {children}
    </button>
  );
}

const noteCardStyle: React.CSSProperties = {
  backgroundColor: '#FFF', borderRadius: 14, padding: '14px 16px', marginBottom: 8,
  border: '1.5px solid #E7E5E4', transition: 'all 150ms ease',
};

const actionBtnStyle: React.CSSProperties = {
  border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, padding: '2px 6px',
};

const miniBtnStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 12, borderRadius: 8, border: '1.5px solid #E7E5E4',
  backgroundColor: '#FFF', color: '#78716C', cursor: 'pointer',
};

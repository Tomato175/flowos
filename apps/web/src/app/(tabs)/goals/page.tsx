'use client';

import { useState } from 'react';
import { useGoalStore, type Objective } from '@/stores/useGoalStore';
import { useTaskStore, type Task } from '@/stores/useTaskStore';

const PERIODS = ['2026-Q3', '2026-Q4', '2026-H2', '2026', '2027'];
const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

export default function GoalsPage() {
  const { objectives, addObjective, deleteObjective, completeObjective, addKeyResult, deleteKeyResult, linkTask, unlinkTask, updateKRProgress, getOverallProgress, getActiveObjectives } = useGoalStore();
  const { tasks } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', timePeriod: '2026-Q3', color: '#7C3AED' });
  const [krForm, setKrForm] = useState<{ objId: string; title: string; targetValue: number; unit: string } | null>(null);

  const active = getActiveObjectives();
  const completed = objectives.filter((o) => o.status === 'completed');

  const submitObjective = () => {
    if (!form.title.trim()) return;
    addObjective({ title: form.title.trim(), description: form.description, timePeriod: form.timePeriod, color: form.color });
    setForm({ title: '', description: '', timePeriod: '2026-Q3', color: '#7C3AED' });
    setShowForm(false);
  };

  const submitKR = (objId: string) => {
    if (!krForm || !krForm.title.trim()) return;
    addKeyResult(objId, { title: krForm.title.trim(), targetValue: krForm.targetValue || 100, currentValue: 0, unit: krForm.unit || '%' });
    setKrForm(null);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px', color: '#1C1917' }}>目标</h1>
          <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>OKR — 目标与关键结果</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ width: 42, height: 42, borderRadius: 13, border: 'none', backgroundColor: showForm ? '#EF4444' : '#7C3AED', color: '#FFF', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showForm ? '✕' : '+'}
        </button>
      </div>

      {/* 新建 Objective */}
      {showForm && (
        <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 16, border: '1.5px solid #7C3AED' }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="目标名称 *" autoFocus
            style={{ fontSize: 16, fontWeight: 600, border: 'none', borderBottom: '1px solid #E7E5E4', outline: 'none', width: '100%', padding: '6px 0', marginBottom: 10 }}
            onKeyDown={(e) => { if (e.key === 'Enter') submitObjective(); }}
          />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）"
            style={{ fontSize: 14, border: 'none', outline: 'none', width: '100%', padding: '4px 0', marginBottom: 10, color: '#78716C' }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={form.timePeriod} onChange={(e) => setForm({ ...form, timePeriod: e.target.value })}
              style={{ fontSize: 13, padding: '5px 10px', borderRadius: 8, border: '1.5px solid #E7E5E4' }}>
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: c, border: form.color === c ? '3px solid #1C1917' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <button onClick={submitObjective}
              style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 8, cursor: 'pointer' }}>创建</button>
          </div>
        </div>
      )}

      {/* ===== 进行中的目标 ===== */}
      {active.length === 0 && completed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A8A29E' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>🎯</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#78716C', margin: '0 0 4px' }}>还没有目标</p>
          <p style={{ fontSize: 13, margin: 0 }}>创建一个 Objective，然后添加可衡量的 Key Results</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {active.map((obj) => (
            <ObjectiveCard key={obj.id} obj={obj}
              expanded={expandedId === obj.id}
              onToggle={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
              progress={getOverallProgress(obj.id)}
              tasks={tasks}
              onAddKR={() => setKrForm({ objId: obj.id, title: '', targetValue: 100, unit: '%' })}
              krForm={krForm}
              onKRFormChange={(f) => setKrForm(f)}
              onSubmitKR={() => krForm && submitKR(krForm.objId)}
              onCancelKR={() => setKrForm(null)}
              onDelete={() => deleteObjective(obj.id)}
              onComplete={() => completeObjective(obj.id)}
              onDeleteKR={(krId) => deleteKeyResult(obj.id, krId)}
              onLinkTask={(krId, tid) => linkTask(obj.id, krId, tid)}
              onUnlinkTask={(krId, tid) => unlinkTask(obj.id, krId, tid)}
              onKRProgress={(krId, v) => updateKRProgress(obj.id, krId, v)}
            />
          ))}
        </div>
      )}

      {/* ===== 已完成 ===== */}
      {completed.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#A8A29E', margin: '0 0 10px' }}>✅ 已完成</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completed.map((obj) => (
              <div key={obj.id} style={{ padding: '10px 14px', backgroundColor: '#F5F5F4', borderRadius: 10, fontSize: 13, color: '#78716C', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: obj.color }} />
                <span style={{ textDecoration: 'line-through' }}>{obj.title}</span>
                <span style={{ fontSize: 11, marginLeft: 'auto' }}>{obj.timePeriod}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Objective 卡片 ===== */
function ObjectiveCard({
  obj, expanded, onToggle, progress,
  tasks, onAddKR, krForm, onKRFormChange, onSubmitKR, onCancelKR,
  onDelete, onComplete,
  onDeleteKR, onLinkTask, onUnlinkTask, onKRProgress,
}: {
  obj: Objective; expanded: boolean; onToggle: () => void; progress: number;
  tasks: Task[];
  onAddKR: () => void;
  krForm: { objId: string; title: string; targetValue: number; unit: string } | null;
  onKRFormChange: (f: typeof krForm) => void;
  onSubmitKR: () => void; onCancelKR: () => void;
  onDelete: () => void; onComplete: () => void;
  onDeleteKR: (krId: string) => void;
  onLinkTask: (krId: string, tid: string) => void;
  onUnlinkTask: (krId: string, tid: string) => void;
  onKRProgress: (krId: string, v: number) => void;
}) {
  return (
    <div style={{ backgroundColor: '#FFF', borderRadius: 16, border: '1.5px solid #E7E5E4', overflow: 'hidden' }}>
      {/* 头部 */}
      <div onClick={onToggle} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: obj.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1917' }}>{obj.title}</div>
          <div style={{ fontSize: 12, color: '#A8A29E' }}>{obj.timePeriod} · {obj.keyResults.length} KR</div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: obj.color }}>{progress}%</span>
        <span style={{ fontSize: 12, color: '#A8A29E' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* 进度条 */}
      <div style={{ height: 4, backgroundColor: '#F5F5F4' }}>
        <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, backgroundColor: obj.color, transition: 'width 0.5s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F5F5F4' }}>
          {obj.description && (
            <p style={{ fontSize: 13, color: '#78716C', margin: '12px 0 0' }}>{obj.description}</p>
          )}

          {/* Key Results */}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E', margin: '0 0 8px' }}>关键结果</p>
            {obj.keyResults.map((kr) => {
              const krProgress = kr.targetValue > 0 ? Math.min((kr.currentValue / kr.targetValue) * 100, 100) : 0;
              const linkedTasks = tasks.filter((t) => kr.taskIds.includes(t.id));
              return (
                <div key={kr.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 13, color: '#292524' }}>{kr.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: obj.color }}>
                      {kr.currentValue}/{kr.targetValue}{kr.unit}
                    </span>
                    <button onClick={() => onDeleteKR(kr.id)}
                      style={{ border: 'none', background: 'none', color: '#D6D3D1', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                  {/* KR 进度条 */}
                  <div style={{ height: 6, backgroundColor: '#F5F5F4', borderRadius: 3, marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${krProgress}%`, backgroundColor: obj.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                  {/* 进度调整 */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <input type="range" min={0} max={kr.targetValue} value={kr.currentValue}
                      onChange={(e) => onKRProgress(kr.id, Number(e.target.value))}
                      style={{ flex: 1, height: 4 }} />
                    <input type="number" value={kr.currentValue}
                      onChange={(e) => onKRProgress(kr.id, Number(e.target.value))}
                      style={{ width: 50, fontSize: 12, padding: '2px 4px', borderRadius: 4, border: '1px solid #E7E5E4', textAlign: 'center' }} />
                  </div>
                  {/* 关联任务 */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {linkedTasks.map((t) => (
                      <span key={t.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: '#EDE9FE', color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {t.title.slice(0, 15)}
                        <button onClick={() => onUnlinkTask(kr.id, t.id)} style={{ border: 'none', background: 'none', color: '#7C3AED', cursor: 'pointer', padding: 0, fontSize: 12 }}>✕</button>
                      </span>
                    ))}
                    <select value=""
                      onChange={(e) => { if (e.target.value) { onLinkTask(kr.id, e.target.value); e.target.value = ''; } }}
                      style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, border: '1px solid #E7E5E4', color: '#A8A29E' }}>
                      <option value="">+ 关联任务</option>
                      {tasks.filter((t) => t.status !== 'done' && t.status !== 'archived' && !kr.taskIds.includes(t.id)).map((t) => (
                        <option key={t.id} value={t.id}>{t.title.slice(0, 20)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

            {/* 新增 KR 表单 */}
            {krForm && krForm.objId === obj.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8, padding: '10px', backgroundColor: '#FAFAF9', borderRadius: 8 }}>
                <input value={krForm.title} onChange={(e) => onKRFormChange({ ...krForm, title: e.target.value })}
                  placeholder="KR 名称"
                  style={{ flex: 1, minWidth: 120, fontSize: 13, border: '1px solid #E7E5E4', borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSubmitKR(); }}
                />
                <input type="number" value={krForm.targetValue} onChange={(e) => onKRFormChange({ ...krForm, targetValue: Number(e.target.value) })}
                  placeholder="目标值" style={{ width: 60, fontSize: 13, border: '1px solid #E7E5E4', borderRadius: 6, padding: '4px 8px', outline: 'none' }} />
                <select value={krForm.unit} onChange={(e) => onKRFormChange({ ...krForm, unit: e.target.value })}
                  style={{ fontSize: 13, padding: '4px 6px', borderRadius: 6, border: '1px solid #E7E5E4' }}>
                  <option value="%">%</option>
                  <option value="次">次</option>
                  <option value="小时">小时</option>
                  <option value="本">本</option>
                  <option value="个">个</option>
                </select>
                <button onClick={onSubmitKR} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 6, cursor: 'pointer' }}>添加</button>
                <button onClick={onCancelKR} style={{ padding: '4px 8px', fontSize: 12, color: '#78716C', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>取消</button>
              </div>
            ) : (
              <button onClick={onAddKR}
                style={{ marginTop: 6, padding: '4px 12px', fontSize: 12, color: '#7C3AED', backgroundColor: '#EDE9FE', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                + 添加关键结果
              </button>
            )}
          </div>

          {/* 目标操作 */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button onClick={onComplete}
              style={{ padding: '5px 14px', fontSize: 12, color: '#10B981', backgroundColor: '#D1FAE5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✓ 完成目标</button>
            <button onClick={onDelete}
              style={{ padding: '5px 14px', fontSize: 12, color: '#EF4444', backgroundColor: '#FEE2E2', border: 'none', borderRadius: 6, cursor: 'pointer' }}>删除</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useGoalStore, type Objective } from '@/stores/useGoalStore';
import { useTaskStore, type Task } from '@/stores/useTaskStore';

const PERIODS = ['2026-Q3', '2026-Q4', '2026-H2', '2026', '2027'];
const COLORS = ['#d35d47', '#c4886e', '#9ea88a', '#8a9ba0', '#a08ab8', '#c4a35a', '#b8857a'];

export default function GoalsPage() {
  const { objectives, addObjective, deleteObjective, completeObjective, addKeyResult, deleteKeyResult, linkTask, unlinkTask, updateKRProgress, getOverallProgress, getActiveObjectives } = useGoalStore();
  const { tasks } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', timePeriod: '2026-Q3', color: '#d35d47' });
  const [krForm, setKrForm] = useState<{ objId: string; title: string; targetValue: number; unit: string } | null>(null);

  const active = getActiveObjectives();
  const completed = objectives.filter((o) => o.status === 'completed');

  const submitObjective = () => {
    if (!form.title.trim()) return;
    addObjective({ title: form.title.trim(), description: form.description, timePeriod: form.timePeriod, color: form.color });
    setForm({ title: '', description: '', timePeriod: '2026-Q3', color: '#d35d47' });
    setShowForm(false);
  };

  const submitKR = (objId: string) => {
    if (!krForm || !krForm.title.trim()) return;
    addKeyResult(objId, { title: krForm.title.trim(), targetValue: krForm.targetValue || 100, currentValue: 0, unit: krForm.unit || '%' });
    setKrForm(null);
  };

  return (
    <div className="animate-enter" style={pageStyle}>
      {/* 头部 */}
      <div style={headerStyle}>
        <div>
          <h1 className="display-medium" style={pageTitleStyle}>目标</h1>
          <p className="caption" style={subtitleStyle}>Objectives &amp; Key Results</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={fabStyle(showForm)}
          aria-label={showForm ? '关闭' : '新建目标'}
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* 新建 Objective */}
      {showForm && (
        <div className="animate-enter" style={formSectionStyle}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="目标名称"
            autoFocus
            className="body-large"
            style={inputStyle}
            onKeyDown={(e) => { if (e.key === 'Enter') submitObjective(); }}
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）"
            className="body-text"
            style={{ ...inputStyle, fontWeight: 400, color: 'var(--color-text-secondary)' }}
          />
          <div style={formRowStyle}>
            <select
              value={form.timePeriod}
              onChange={(e) => setForm({ ...form, timePeriod: e.target.value })}
              className="body-small"
              style={selectStyle}
            >
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={colorPickerRowStyle}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={colorDotStyle(c, form.color === c)}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <button onClick={submitObjective} className="label-text" style={submitBtnStyle}>
              创建目标
            </button>
          </div>
        </div>
      )}

      {/* ===== 进行中的目标 ===== */}
      {active.length === 0 && completed.length === 0 ? (
        <div style={emptyStyle}>
          <p className="display-large" style={emptyEmojiStyle}>🎯</p>
          <p className="heading-3" style={emptyTitleStyle}>还没有目标</p>
          <p className="body-text" style={emptyDescStyle}>创建一个 Objective，然后添加可衡量的 Key Results</p>
        </div>
      ) : (
        <div style={objectivesListStyle}>
          {active.map((obj, index) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              expanded={expandedId === obj.id}
              onToggle={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
              progress={getOverallProgress(obj.id)}
              tasks={tasks}
              index={index}
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
        <>
          <div style={{ height: 1, backgroundColor: 'var(--color-divider)', margin: 'var(--space-10) 0 var(--space-6)' }} />
          <p className="label-text" style={{ color: 'var(--color-text-muted)', margin: '0 0 var(--space-4)' }}>
            已完成的目标
          </p>
          <div style={completedListStyle}>
            {completed.map((obj) => (
              <div key={obj.id} className="body-small" style={completedItemStyle}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: obj.color, flexShrink: 0, opacity: 0.5 }} />
                <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>{obj.title}</span>
                <span className="caption" style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>{obj.timePeriod}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Objective 卡片 ===== */
function ObjectiveCard({
  obj, expanded, onToggle, progress,
  tasks, index, onAddKR, krForm, onKRFormChange, onSubmitKR, onCancelKR,
  onDelete, onComplete,
  onDeleteKR, onLinkTask, onUnlinkTask, onKRProgress,
}: {
  obj: Objective; expanded: boolean; onToggle: () => void; progress: number;
  tasks: Task[];
  index: number;
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
    <div className="stagger-item" style={{ ...cardStyle, animationDelay: `${index * 0.06}s` }}>
      {/* 头部 */}
      <div onClick={onToggle} style={cardHeaderStyle}>
        <span style={{ ...colorIndicatorStyle, backgroundColor: obj.color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="heading-3" style={objectiveTitleStyle}>{obj.title}</div>
          <div className="caption" style={objectiveMetaStyle}>{obj.timePeriod} · {obj.keyResults.length} 个关键结果</div>
        </div>
        <span className="display-medium" style={{ ...progressNumStyle, color: obj.color }}>
          {progress}%
        </span>
        <span className="caption" style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
          {expanded ? '▴' : '▾'}
        </span>
      </div>

      {/* 进度条 */}
      <div style={progressBarStyle}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: obj.color,
          transition: 'width var(--transition-slow) var(--ease-out-expo)',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div style={expandedContentStyle}>
          {obj.description && (
            <p className="body-text" style={descStyle}>{obj.description}</p>
          )}

          {/* Key Results */}
          <div style={krSectionStyle}>
            <p className="label-text" style={krSectionTitleStyle}>关键结果</p>
            {obj.keyResults.map((kr) => {
              const krProgress = kr.targetValue > 0 ? Math.min((kr.currentValue / kr.targetValue) * 100, 100) : 0;
              const linkedTasks = tasks.filter((t) => kr.taskIds.includes(t.id));
              return (
                <div key={kr.id} style={krItemStyle}>
                  <div style={krHeaderRowStyle}>
                    <span className="body-text" style={krTitleStyle}>{kr.title}</span>
                    <span className="label-text" style={{ ...krValueStyle, color: obj.color }}>
                      {kr.currentValue}/{kr.targetValue}{kr.unit}
                    </span>
                    <button
                      onClick={() => onDeleteKR(kr.id)}
                      style={krDeleteStyle}
                      aria-label="删除关键结果"
                    >×</button>
                  </div>
                  {/* KR 进度条 */}
                  <div style={krProgressBarStyle}>
                    <div style={{
                      height: '100%',
                      width: `${krProgress}%`,
                      backgroundColor: obj.color,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-base) var(--ease-out-quart)',
                    }} />
                  </div>
                  {/* 进度调整 */}
                  <div style={krSliderRowStyle}>
                    <input
                      type="range"
                      min={0}
                      max={kr.targetValue}
                      value={kr.currentValue}
                      onChange={(e) => onKRProgress(kr.id, Number(e.target.value))}
                      style={rangeSliderStyle}
                    />
                    <input
                      type="number"
                      value={kr.currentValue}
                      onChange={(e) => onKRProgress(kr.id, Number(e.target.value))}
                      className="body-small"
                      style={numberInputStyle}
                    />
                  </div>
                  {/* 关联任务 */}
                  <div style={linkedTasksRowStyle}>
                    {linkedTasks.map((t) => (
                      <span key={t.id} className="caption" style={linkedTaskBadgeStyle}>
                        {t.title.slice(0, 15)}
                        <button
                          onClick={() => onUnlinkTask(kr.id, t.id)}
                          style={linkedTaskRemoveStyle}
                        >×</button>
                      </span>
                    ))}
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) { onLinkTask(kr.id, e.target.value); e.target.value = ''; } }}
                      className="caption"
                      style={linkSelectStyle}
                    >
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
              <div style={krFormStyle}>
                <input
                  value={krForm.title}
                  onChange={(e) => onKRFormChange({ ...krForm, title: e.target.value })}
                  placeholder="关键结果名称"
                  className="body-small"
                  style={krFormInputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSubmitKR(); }}
                />
                <input
                  type="number"
                  value={krForm.targetValue}
                  onChange={(e) => onKRFormChange({ ...krForm, targetValue: Number(e.target.value) })}
                  placeholder="目标值"
                  className="body-small"
                  style={{ ...krFormInputStyle, width: 64 }}
                />
                <select
                  value={krForm.unit}
                  onChange={(e) => onKRFormChange({ ...krForm, unit: e.target.value })}
                  className="body-small"
                  style={krUnitSelectStyle}
                >
                  <option value="%">%</option>
                  <option value="次">次</option>
                  <option value="小时">小时</option>
                  <option value="本">本</option>
                  <option value="个">个</option>
                </select>
                <button onClick={onSubmitKR} className="label-text" style={krFormSubmitStyle}>添加</button>
                <button onClick={onCancelKR} className="body-small" style={krFormCancelStyle}>取消</button>
              </div>
            ) : (
              <button onClick={onAddKR} className="body-small" style={addKRBtnStyle}>
                + 添加关键结果
              </button>
            )}
          </div>

          {/* 目标操作 */}
          <div style={objectiveActionsStyle}>
            <button onClick={onComplete} className="label-text" style={completeBtnStyle}>
              完成目标
            </button>
            <button onClick={onDelete} className="label-text" style={deleteBtnStyle}>
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 页面样式 ===== */

const pageStyle: React.CSSProperties = {
  maxWidth: 680,
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
  borderRadius: 0,
};

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const selectStyle: React.CSSProperties = {
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

const colorPickerRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'center',
};

const colorDotStyle = (color: string, active: boolean): React.CSSProperties => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: color,
  border: active ? '3px solid var(--color-text)' : '2px solid transparent',
  cursor: 'pointer',
  padding: 0,
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
});

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
  margin: 0,
};

const objectivesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

/* ===== Objective 卡片样式 ===== */

const cardStyle: React.CSSProperties = {
  borderTop: '1px solid var(--color-divider)',
  paddingTop: 'var(--space-4)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  cursor: 'pointer',
  padding: 'var(--space-2) 0',
};

const colorIndicatorStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  flexShrink: 0,
};

const objectiveTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text)',
  margin: 0,
};

const objectiveMetaStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  marginTop: 'var(--space-1)',
};

const progressNumStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: '-0.02em',
};

const progressBarStyle: React.CSSProperties = {
  height: 3,
  backgroundColor: 'var(--color-divider)',
  marginTop: 'var(--space-2)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

const expandedContentStyle: React.CSSProperties = {
  padding: 'var(--space-4) 0 var(--space-2)',
};

const descStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-4)',
  lineHeight: 1.6,
};

const krSectionStyle: React.CSSProperties = {
  marginTop: 'var(--space-2)',
};

const krSectionTitleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  margin: '0 0 var(--space-4)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const krItemStyle: React.CSSProperties = {
  marginBottom: 'var(--space-5)',
  paddingBottom: 'var(--space-4)',
  borderBottom: '1px solid var(--color-divider)',
};

const krHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-2)',
};

const krTitleStyle: React.CSSProperties = {
  flex: 1,
  color: 'var(--color-text)',
};

const krValueStyle: React.CSSProperties = {
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const krDeleteStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 14,
  padding: 'var(--space-1)',
  lineHeight: 1,
};

const krProgressBarStyle: React.CSSProperties = {
  height: 5,
  backgroundColor: 'var(--color-bg)',
  borderRadius: 'var(--radius-full)',
  marginBottom: 'var(--space-2)',
  overflow: 'hidden',
};

const krSliderRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
  marginBottom: 'var(--space-2)',
};

const rangeSliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  accentColor: 'var(--color-primary)',
};

const numberInputStyle: React.CSSProperties = {
  width: 56,
  fontSize: 'inherit',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  textAlign: 'center',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  outline: 'none',
};

const linkedTasksRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const linkedTaskBadgeStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: 'var(--space-0) var(--space-3)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
};

const linkedTaskRemoveStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  padding: 0,
  fontSize: 12,
  lineHeight: 1,
  opacity: 0.6,
};

const linkSelectStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
};

const krFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 'var(--space-3)',
  padding: 'var(--space-3) 0',
};

const krFormInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 120,
  fontSize: 'inherit',
  border: 'none',
  borderBottom: '1.5px solid var(--color-border)',
  padding: 'var(--space-1) var(--space-2)',
  outline: 'none',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  borderRadius: 0,
};

const krUnitSelectStyle: React.CSSProperties = {
  fontSize: 'inherit',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  borderBottom: '1.5px solid var(--color-border)',
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  outline: 'none',
};

const krFormSubmitStyle: React.CSSProperties = {
  padding: 'var(--space-1) var(--space-4)',
  fontSize: 'inherit',
  fontWeight: 600,
  color: 'var(--color-surface)',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const krFormCancelStyle: React.CSSProperties = {
  padding: 'var(--space-1) var(--space-3)',
  fontSize: 'inherit',
  color: 'var(--color-text-muted)',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const addKRBtnStyle: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-4)',
  fontSize: 'inherit',
  color: 'var(--color-primary)',
  backgroundColor: 'transparent',
  border: '1.5px solid var(--color-primary)',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
};

const objectiveActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-6)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--color-divider)',
};

const completeBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-5)',
  fontSize: 'inherit',
  fontWeight: 600,
  color: 'var(--color-success)',
  backgroundColor: 'transparent',
  border: '1.5px solid var(--color-success)',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-5)',
  fontSize: 'inherit',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  backgroundColor: 'transparent',
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast) var(--ease-out-quart)',
  fontFamily: 'inherit',
};

/* 已完成列表 */
const completedListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const completedItemStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-2)',
  color: 'var(--color-text-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  borderBottom: '1px solid var(--color-divider)',
};

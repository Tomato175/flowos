'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseReady, migrateFromLocal, loadFromCloud } from '@/lib/sync';
import { createClient } from '@/lib/supabase';
import { useAudioStore } from '@/stores/useAudioStore';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const supabase = createClient();
  const syncFromCloud = useAudioStore((s) => s.syncFromCloud);

  const [mode, setMode] = useState<'magic' | 'password'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const redirect = () => router.replace('/today');
      const timeoutId = setTimeout(redirect, 3000);
      isSupabaseReady()
        .then((ready) => {
          if (ready) {
            migrateFromLocal(user.id);
            loadFromCloud(user.id);
            syncFromCloud(user.id);
            setTimeout(redirect, 1000);
          }
          else redirect();
        })
        .catch(redirect)
        .finally(() => clearTimeout(timeoutId));
    }
  }, [user, loading, router]);

  const handlePasswordLogin = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      if (err.message.includes('Invalid login')) {
        setError('邮箱或密码错误');
      } else {
        setError(err.message);
      }
    }
    setSubmitting(false);
  };

  const handlePasswordSignup = async () => {
    if (!email || password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
    } else {
      setError('');
      // auto-login after signup
      await supabase.auth.signInWithPassword({ email, password });
    }
    setSubmitting(false);
  };

  const [forceShowLogin, setForceShowLogin] = useState(false);

  useEffect(() => {
    // 2 秒后如果还在 loading，给用户一个跳过按钮
    if (loading) {
      const id = setTimeout(() => setForceShowLogin(true), 2000);
      return () => clearTimeout(id);
    }
  }, [loading]);

  if (loading && !forceShowLogin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#A8A29E', fontSize: 14, gap: 16 }}>
        <div>🌀 加载中...</div>
        <button onClick={() => setForceShowLogin(true)}
          style={{ padding: '6px 16px', fontSize: 12, color: '#7C3AED', backgroundColor: 'transparent', border: '1px solid #7C3AED', borderRadius: 6, cursor: 'pointer' }}>
          跳过 → 进入登录
        </button>
      </div>
    );
  }

  if (user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, backgroundColor: '#FAFAF9' }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🌀</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', margin: '0 0 4px' }}>心流OS</h1>
      <p style={{ fontSize: 14, color: '#78716C', margin: '0 0 32px', textAlign: 'center' }}>开源个人生活中枢</p>

      <div style={{ width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 16, padding: 24, border: '1.5px solid #E7E5E4' }}>
        {/* 模式切换 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, backgroundColor: '#F5F5F4', borderRadius: 10, padding: 3 }}>
          <button onClick={() => { setMode('password'); setError(''); }}
            style={tabStyle(mode === 'password')}>🔐 密码登录</button>
          <button onClick={() => { setMode('magic'); setError(''); }}
            style={tabStyle(mode === 'magic')}>✉️ 免密登录</button>
        </div>

        {/* ===== 密码模式 ===== */}
        {mode === 'password' && (
          <>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址" autoComplete="email"
              style={inputStyle} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="密码" autoComplete="current-password"
              style={{ ...inputStyle, marginBottom: 8 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordLogin(); }} />

            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px' }}>{error}</p>}

            <button onClick={handlePasswordLogin} disabled={!email || !password || submitting}
              style={primaryBtnStyle(!email || !password || submitting)}>
              {submitting ? '登录中...' : '登录'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: '#A8A29E' }}>还没有账号？</span>
              <button onClick={handlePasswordSignup} disabled={!email || password.length < 6 || submitting}
                style={{ fontSize: 12, color: '#7C3AED', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600, marginLeft: 4 }}>
                注册
              </button>
            </div>

            <p style={{ fontSize: 10, color: '#A8A29E', marginTop: 10, textAlign: 'center' }}>
              登录后会话自动保持，下次打开无需重新登录
            </p>
          </>
        )}

        {/* ===== 免密模式 ===== */}
        {mode === 'magic' && (
          <>
            {!sent ? (
              <>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱地址" autoComplete="email"
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter' && email) { signIn(email); setSent(true); } }} />
                <button onClick={() => { if (email) { signIn(email); setSent(true); } }} disabled={!email}
                  style={primaryBtnStyle(!email)}>
                  发送魔法链接
                </button>
                <p style={{ fontSize: 11, color: '#A8A29E', marginTop: 10, textAlign: 'center' }}>
                  无需密码，点击邮件中的链接即可登录
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📧</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1C1917', margin: '0 0 4px' }}>邮件已发送</p>
                <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 16px' }}>请查看 {email}</p>
                <button onClick={() => setSent(false)}
                  style={{ padding: '8px 20px', fontSize: 13, color: '#7C3AED', backgroundColor: 'transparent', border: '1.5px solid #7C3AED', borderRadius: 8, cursor: 'pointer' }}>换邮箱</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #E7E5E4',
  borderRadius: 10, outline: 'none', marginBottom: 12, boxSizing: 'border-box',
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px', fontSize: 15, fontWeight: 600,
  color: '#FFF', backgroundColor: disabled ? '#D6D3D1' : '#7C3AED',
  border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
});

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: active ? 600 : 400,
  borderRadius: 8, border: 'none', backgroundColor: active ? '#FFF' : 'transparent',
  color: active ? '#1C1917' : '#78716C', cursor: 'pointer',
  transition: 'all 150ms ease', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
});

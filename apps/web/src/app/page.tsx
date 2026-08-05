'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseReady, migrateFromLocal, loadFromCloud } from '@/lib/sync';
import { createClient } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const supabase = createClient();

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          gap: 'var(--space-4)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <div>🌀 加载中...</div>
        <button
          onClick={() => setForceShowLogin(true)}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-primary)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          跳过 → 进入登录
        </button>
      </div>
    );
  }

  if (user) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Magazine hero: centered serif display */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-10)',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)', lineHeight: 1 }}>🌀</div>
        <h1
          className="display-large"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-2)',
            lineHeight: 1.1,
          }}
        >
          心流OS
        </h1>
        <p
          className="body-large"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          开源个人生活中枢
        </p>
      </div>

      {/* Login card: minimal, no heavy border */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8) var(--space-6)',
          border: '1px solid var(--color-divider)',
        }}
      >
        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 'var(--space-6)',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-full)',
            padding: 3,
          }}
        >
          <button
            onClick={() => {
              setMode('password');
              setError('');
            }}
            style={tabStyle(mode === 'password')}
          >
            🔐 密码登录
          </button>
          <button
            onClick={() => {
              setMode('magic');
              setError('');
            }}
            style={tabStyle(mode === 'magic')}
          >
            ✉️ 免密登录
          </button>
        </div>

        {/* ===== Password mode ===== */}
        {mode === 'password' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
              autoComplete="email"
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              autoComplete="current-password"
              style={{ ...inputStyle, marginBottom: 'var(--space-2)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasswordLogin();
              }}
            />

            {error && (
              <p
                className="body-small"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-error)',
                  margin: '0 0 var(--space-2)',
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handlePasswordLogin}
              disabled={!email || !password || submitting}
              style={primaryBtnStyle(!email || !password || submitting)}
            >
              {submitting ? '登录中...' : '登录'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
              <span
                className="body-small"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                }}
              >
                还没有账号？
              </span>
              <button
                onClick={handlePasswordSignup}
                disabled={!email || password.length < 6 || submitting}
                style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-primary)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: 'var(--space-1)',
                }}
              >
                注册
              </button>
            </div>

            <p
              className="caption"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              登录后会话自动保持，下次打开无需重新登录
            </p>
          </>
        )}

        {/* ===== Magic link mode ===== */}
        {mode === 'magic' && (
          <>
            {!sent ? (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱地址"
                  autoComplete="email"
                  style={inputStyle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email) {
                      signIn(email);
                      setSent(true);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (email) {
                      signIn(email);
                      setSent(true);
                    }
                  }}
                  disabled={!email}
                  style={primaryBtnStyle(!email)}
                >
                  发送魔法链接
                </button>
                <p
                  className="caption"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--space-3)',
                    textAlign: 'center',
                  }}
                >
                  无需密码，点击邮件中的链接即可登录
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 44, margin: '0 0 var(--space-4)', lineHeight: 1 }}>
                  📧
                </p>
                <p
                  className="heading-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text)',
                    margin: '0 0 var(--space-1)',
                  }}
                >
                  邮件已发送
                </p>
                <p
                  className="body-text"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 var(--space-6)',
                  }}
                >
                  请查看 {email}
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{
                    padding: 'var(--space-2) var(--space-5)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  换邮箱
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  marginBottom: 'var(--space-3)',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  transition: 'var(--transition-fast)',
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-bg)',
  backgroundColor: disabled
    ? 'var(--color-text-muted)'
    : 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'var(--transition-fast)',
});

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  borderRadius: 'var(--radius-full)',
  border: 'none',
  backgroundColor: active ? 'var(--color-surface)' : 'transparent',
  color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
  cursor: 'pointer',
  transition: 'var(--transition-fast)',
});

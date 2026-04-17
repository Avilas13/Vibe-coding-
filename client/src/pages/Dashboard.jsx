import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BuddyChat from '../components/BuddyChat';
import VocabularySection from '../components/VocabularySection';
import WritingExercise from '../components/WritingExercise';

const NAV_ITEMS = [
  { id: 'chat', icon: '💬', label: 'Chat with Buddy' },
  { id: 'vocabulary', icon: '📚', label: 'Vocabulary Lists' },
  { id: 'writing', icon: '✍️', label: 'Writing Exercise' },
];

export default function Dashboard() {
  const { user, loading, logout, progress } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Loading English Buddy…</span>
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.name || user.login || '?').charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <span>English Buddy</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: '24px', padding: '0 4px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 12px' }}>
              My Progress
            </div>
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="progress-bar-wrap">
                <label><span>Words learned</span><span>{progress.wordsLearned}</span></label>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, (progress.wordsLearned / 40) * 100)}%` }} /></div>
              </div>
              <div className="progress-bar-wrap">
                <label><span>Writing score</span><span>{progress.writingScore}%</span></label>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress.writingScore}%` }} /></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Level: <strong style={{ color: 'var(--purple-light)' }}>{progress.level}</strong>
                &ensp;·&ensp; {progress.sessionsCount} sessions
              </div>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">{initials}</div>
            )}
            <div className="user-info">
              <div className="user-name">{user.name || user.login}</div>
              <div className="user-login">@{user.login}{user.isDemo ? ' (demo)' : ''}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Logout"
              style={{ padding: '4px 8px' }}
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="main-content">
        {activeTab === 'chat' && <BuddyChat />}
        {activeTab === 'vocabulary' && <VocabularySection />}
        {activeTab === 'writing' && <WritingExercise />}
      </main>
    </div>
  );
}

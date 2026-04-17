import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['B1', 'B2', 'C1', 'C2'];

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ScoreBadge({ score, grade }) {
  const cls = grade === 'Excellent' ? 'excellent' : grade === 'Good' ? 'good' : grade === 'Satisfactory' ? 'satisfactory' : 'needs-improvement';
  return (
    <div className="score-ring">
      <div>
        <div className={`score-number ${cls}`}>{score}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/100</div>
      </div>
      <div>
        <div className={`score-grade ${cls}`}>{grade}</div>
        <div className="score-label">Overall score</div>
      </div>
    </div>
  );
}

export default function WritingExercise() {
  const { updateProgress } = useAuth();
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState('');

  const loadTopic = useCallback(async (lvl) => {
    setTopicLoading(true);
    setFeedback(null);
    setText('');
    setError('');
    try {
      const data = await api.getWritingTopic(lvl);
      setTopic(data);
    } catch {
      setError('Could not load writing topic. Is the server running?');
    } finally {
      setTopicLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopic(level);
  }, [level, loadTopic]);

  const handleAnalyse = async () => {
    if (text.trim().length < 30) {
      setError('Please write at least 30 characters before submitting.');
      return;
    }
    setAnalysing(true);
    setError('');
    try {
      const result = await api.analyzeWriting(text);
      setFeedback(result);
      updateProgress({ writingScore: result.overallScore });
    } catch {
      setError('Analysis failed. Is the server running?');
    } finally {
      setAnalysing(false);
    }
  };

  const wordCount = countWords(text);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Writing Exercise ✍️</h1>
        <p>Pick a topic, write your response, then get instant grammar and vocabulary feedback.</p>
      </div>

      <div className="page-body">
        {/* Level selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Level:</span>
          <div className="level-tabs">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className={`level-tab ${level === lvl ? 'active' : ''}`}
                onClick={() => setLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => loadTopic(level)}
            disabled={topicLoading}
          >
            {topicLoading ? '⏳' : '🔀'} New topic
          </button>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="writing-layout">
          {/* Left: Topic + Editor */}
          <div>
            {topic ? (
              <div className="topic-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3>{topic.title}</h3>
                  <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
                </div>
                <p>{topic.prompt}</p>
                <div className="topic-meta">
                  <span className="topic-word-count">📝 {topic.wordCount}</span>
                </div>
                {topic.tips && topic.tips.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Tips:</strong> {topic.tips.join(' · ')}
                  </div>
                )}
                {topic.keyVocabulary && topic.keyVocabulary.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>Try to use these words:</div>
                    <div className="key-vocab-chips">
                      {topic.keyVocabulary.map((w) => (
                        <span key={w} className="key-vocab-chip">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : topicLoading ? (
              <div className="spinner" />
            ) : null}

            <textarea
              className="writing-textarea"
              placeholder="Start writing your response here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className={`word-counter ${wordCount >= 50 ? 'ok' : wordCount >= 20 ? 'warn' : ''}`}>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
              {topic?.wordCount && ` (target: ${topic.wordCount})`}
            </div>

            <div className="writing-actions">
              <button
                className="btn btn-primary"
                onClick={handleAnalyse}
                disabled={analysing || text.trim().length < 30}
              >
                {analysing ? '⏳ Analysing…' : '🔍 Check my writing'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setText(''); setFeedback(null); }}
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Right: Feedback sidebar */}
          <div className="feedback-sidebar">
            {!feedback && !analysing && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: '0.85rem' }}>
                  Write your response and click <strong style={{ color: 'var(--text-secondary)' }}>"Check my writing"</strong> to see detailed feedback.
                </div>
              </div>
            )}

            {analysing && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analysing your writing…</div>
              </div>
            )}

            {feedback && !analysing && (
              <div className="slide-up">
                <h3>Feedback 📋</h3>

                <ScoreBadge score={feedback.overallScore} grade={feedback.grade} />

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{feedback.wordCount}</div>
                    <div style={{ color: 'var(--text-muted)' }}>words</div>
                  </div>
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{feedback.sentenceCount}</div>
                    <div style={{ color: 'var(--text-muted)' }}>sentences</div>
                  </div>
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{feedback.averageSentenceLength}</div>
                    <div style={{ color: 'var(--text-muted)' }}>avg words/sent.</div>
                  </div>
                </div>

                {/* Grammar issues */}
                {feedback.grammarIssues && feedback.grammarIssues.length > 0 && (
                  <div className="issue-section">
                    <h4>🔴 Grammar Issues</h4>
                    {feedback.grammarIssues.map((issue, i) => (
                      <div key={i} className={`issue-item ${issue.severity}`}>
                        {issue.message}
                        {issue.occurrences && issue.occurrences.length > 0 && (
                          <div style={{ marginTop: 4, color: 'var(--red)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            → "{issue.occurrences[0]}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Style issues */}
                {feedback.styleIssues && feedback.styleIssues.length > 0 && (
                  <div className="issue-section">
                    <h4>🟡 Style & Structure</h4>
                    {feedback.styleIssues.map((issue, i) => (
                      <div key={i} className={`issue-item ${issue.severity}`}>
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vocabulary suggestions */}
                {feedback.vocabularySuggestions && feedback.vocabularySuggestions.length > 0 && (
                  <div className="issue-section">
                    <h4>💡 Vocabulary Upgrades</h4>
                    {feedback.vocabularySuggestions.map((s, i) => (
                      <div key={i} className="suggestion-item">
                        <span className="word-original">"{s.word}"</span>
                        {' → '}
                        <span className="word-suggestions">{s.suggestions.slice(0, 3).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Transitions used */}
                {feedback.transitionsUsed && feedback.transitionsUsed.length > 0 && (
                  <div className="issue-section">
                    <h4>✅ Cohesive Devices Used</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {feedback.transitionsUsed.map((t) => (
                        <span key={t} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encouragement */}
                <div className="encouragement-box">
                  🌟 {feedback.encouragement}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

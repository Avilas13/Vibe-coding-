import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['B1', 'B2', 'C1', 'C2'];

const LEVEL_DESCRIPTIONS = {
  B1: 'Intermediate — core everyday vocabulary',
  B2: 'Upper Intermediate — academic & professional words',
  C1: 'Advanced — sophisticated expressions',
  C2: 'Mastery — literary & academic precision',
};

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function WordCard({ word }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="word-card" onClick={() => setExpanded((e) => !e)}>
      <div className="word-card-header">
        <div>
          <div className="word-title">{word.word}</div>
          <div className="word-phonetic">{word.phonetic}</div>
          <div className="word-pos">{word.partOfSpeech}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span className={`badge badge-${word.level.toLowerCase()}`}>{word.level}</span>
          <button
            className="speak-btn"
            onClick={(e) => { e.stopPropagation(); speak(word.word); }}
            title="Hear pronunciation"
          >
            🔊 Hear
          </button>
        </div>
      </div>

      <div className="word-definition">{word.definition}</div>
      <div className="word-example">"{word.example}"</div>

      {expanded && (
        <div className="word-detail fade-in">
          <div className="word-tip">💡 {word.tips}</div>
          {word.commonMistakes && word.commonMistakes.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--red)', marginBottom: 8 }}>
              ⚠️ <strong>Common mistakes:</strong> {word.commonMistakes.join(' · ')}
            </div>
          )}
          {word.synonyms && word.synonyms.length > 0 && (
            <div className="word-synonyms">
              <strong>Synonyms:</strong> {word.synonyms.join(', ')}
            </div>
          )}
          {word.antonyms && word.antonyms.length > 0 && (
            <div className="word-synonyms" style={{ marginTop: 4 }}>
              <strong>Antonyms:</strong> {word.antonyms.join(', ')}
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              speak(`${word.word}. ${word.definition}. Example: ${word.example}`);
            }}
          >
            🔊 Hear full definition
          </button>
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
        {expanded ? '▲ less' : '▼ more'}
      </div>
    </div>
  );
}

export default function VocabularySection() {
  const { updateProgress, progress } = useAuth();
  const [activeLevel, setActiveLevel] = useState('B1');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadWords = useCallback(async (level) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getVocabulary(level);
      setWords(data.words || []);
    } catch {
      setError('Could not load vocabulary. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWords(activeLevel);
  }, [activeLevel, loadWords]);

  const filtered = words.filter(
    (w) =>
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase())
  );

  const markLevelPracticed = () => {
    const newScores = { ...progress.levelScores, [activeLevel]: Math.min(100, (progress.levelScores[activeLevel] || 0) + 10) };
    const newWordsLearned = (progress.wordsLearned || 0) + 1;
    updateProgress({ levelScores: newScores, wordsLearned: newWordsLearned });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Vocabulary Lists 📚</h1>
        <p>Browse CEFR-aligned words from B1 to C2. Click any card for tips, synonyms, and common mistakes.</p>
      </div>

      <div className="page-body">
        {/* Level selector */}
        <div className="level-tabs">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              className={`level-tab ${activeLevel === lvl ? 'active' : ''}`}
              onClick={() => { setActiveLevel(lvl); setSearch(''); }}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            <span className={`badge badge-${activeLevel.toLowerCase()}`}>{activeLevel}</span>
            &ensp;{LEVEL_DESCRIPTIONS[activeLevel]}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search words or definitions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              width: '100%',
              maxWidth: 400,
              outline: 'none',
            }}
          />
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            <div className="vocab-grid">
              {filtered.map((word) => (
                <WordCard key={word.word} word={word} />
              ))}
            </div>

            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
                No words found for "{search}".
              </div>
            )}

            {filtered.length > 0 && (
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={markLevelPracticed}>
                  ✅ Mark {activeLevel} as practised
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => speak(filtered.map((w) => w.word).join(', '))}
                >
                  🔊 Hear all words
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSpeech from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Buddy conversation engine ─────────────────────────────────────────────────

const MODES = [
  { id: 'chat', label: '💬 Free Chat' },
  { id: 'vocab', label: '📝 Vocabulary Quiz' },
  { id: 'pronunciation', label: '🎙️ Pronunciation' },
  { id: 'tips', label: '💡 Study Tips' },
];

const GREETINGS = [
  "Hello! I'm Buddy, your English coach. 👋 How can I help you today?",
  "Hi there! Ready to boost your English? 🚀 Pick a mode below or just chat with me!",
  "Welcome back! Let's work on your English today. 😊 What would you like to practise?",
];

const STUDY_TIPS = [
  "📖 Read at least one English article every day — try BBC Learning English or The Guardian.",
  "🎧 Listen to English podcasts during commute — 'Stuff You Should Know' is great for all levels.",
  "✍️ Keep a vocabulary notebook. Write the word, definition, and YOUR own example sentence.",
  "🗣️ Practise speaking aloud, even when alone. Read passages out loud to build fluency.",
  "🔁 Review new vocabulary using spaced repetition (e.g., Anki).",
  "🎬 Watch English films with English subtitles — not your native language subtitles!",
  "📝 Write a short journal entry in English every evening (5–10 sentences is enough).",
  "🤝 Find a language partner or join an English conversation club online.",
  "🔍 When you see an unknown word, don't skip it — look it up and write a sentence with it.",
  "📏 Learn collocations, not just single words — e.g., 'make a decision', not just 'decision'.",
];

const PRONUNCIATION_SENTENCES = [
  { text: "She sells seashells by the seashore.", focus: "sh / s sounds" },
  { text: "How much wood would a woodchuck chuck?", focus: "w / oo sounds" },
  { text: "The thirty-three thieves thought they thrilled the throne.", focus: "th sound" },
  { text: "I thought a thought, but the thought I thought was not the thought I thought.", focus: "th sound" },
  { text: "Red lorry, yellow lorry.", focus: "r / l distinction" },
  { text: "Whether the weather is fine or whether the weather is not.", focus: "wh / w sounds" },
  { text: "Peter Piper picked a peck of pickled peppers.", focus: "p sound" },
  { text: "The big, bad bear bit the bold boy.", focus: "b sound" },
  { text: "My mother makes magnificent mango mousse.", focus: "m / a sounds" },
  { text: "I need unique New York.", focus: "n / j sounds" },
];

/** Escape HTML entities then apply bold markdown safely */
function renderBuddyText(raw) {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function diffWords(expected, heard) {
  const exp = expected.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const got = heard.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  return exp.map((word, i) => ({
    word,
    status: got[i] === word ? 'correct' : got[i] ? 'wrong' : 'missing',
    heard: got[i] || null,
  }));
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BuddyChat() {
  const { updateProgress, progress } = useAuth();
  const { speak, startListening, stopListening, transcript, isListening, isSpeaking, supported } =
    useSpeech();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPronSentence, setCurrentPronSentence] = useState(null);
  const [pronResult, setPronResult] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [micWarning, setMicWarning] = useState('');
  const bottomRef = useRef(null);

  const initialised = useRef(false);

  // ── Init greeting ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setMessages([{ id: Date.now(), sender: 'buddy', text: greeting, time: new Date() }]);
    speak(greeting);
    // increment session count once on mount — use functional updater to avoid stale ref
    updateProgress((prev) => ({ sessionsCount: (prev.sessionsCount || 0) + 1 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Message helpers ────────────────────────────────────────────────────────
  const addBuddyMessage = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'buddy', text, time: new Date() },
    ]);
  }, []);

  const addUserMessage = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text, time: new Date() },
    ]);
  }, []);

  const buddyReply = useCallback(
    async (replyText, delay = 900) => {
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, delay));
      setIsTyping(false);
      addBuddyMessage(replyText);
      speak(replyText);
    },
    [addBuddyMessage, speak]
  );

  // ── Mode switching ─────────────────────────────────────────────────────────
  const handleModeChange = useCallback(
    async (newMode) => {
      setMode(newMode);
      setPronResult(null);
      setCurrentWord(null);

      if (newMode === 'vocab') {
        addBuddyMessage("Let's test your vocabulary! I'll fetch a word for you… 🔍");
        try {
          const word = await api.getRandomWord(progress.level);
          setCurrentWord(word);
          const msg = `Here's your word: **${word.word}** (${word.phonetic})\n\n📖 Definition: ${word.definition}\n\nCan you use this word in a sentence? Type or speak your answer!`;
          await buddyReply(msg);
        } catch {
          await buddyReply("Oops, I couldn't fetch a word right now. Try again!");
        }
      } else if (newMode === 'pronunciation') {
        const sentence = PRONUNCIATION_SENTENCES[Math.floor(Math.random() * PRONUNCIATION_SENTENCES.length)];
        setCurrentPronSentence(sentence);
        await buddyReply(
          `Let's practise pronunciation! 🎙️\n\nFocus: **${sentence.focus}**\n\nPlease say this sentence:\n"${sentence.text}"\n\nPress the 🎙️ mic button and read it aloud!`
        );
      } else if (newMode === 'tips') {
        const tip = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];
        await buddyReply(`Here's a study tip for you:\n\n${tip}\n\nWould you like another tip?`);
      } else {
        await buddyReply("Great! Let's chat freely. Ask me anything about English, or just talk to me! 😊");
      }
    },
    [addBuddyMessage, buddyReply, progress.level]
  );

  // ── User sends a message ───────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text) => {
      const msg = text.trim();
      if (!msg) return;
      addUserMessage(msg);
      setInput('');

      const lower = msg.toLowerCase();

      if (mode === 'vocab' && currentWord) {
        const wordUsed = lower.includes(currentWord.word.toLowerCase());
        if (wordUsed) {
          await buddyReply(
            `✅ Excellent! You used "${currentWord.word}" correctly!\n\n💡 Tip: ${currentWord.tips}\n\nSynonyms: ${currentWord.synonyms.join(', ')}\n\nReady for the next word? (type "next" or switch mode)`
          );
          updateProgress({ wordsLearned: (progress.wordsLearned || 0) + 1 });
        } else {
          await buddyReply(
            `Hmm, I didn't see the word "${currentWord.word}" in your sentence. Try again, or type "next" for a different word.\n\nReminder — example: "${currentWord.example}"`
          );
        }

        if (lower === 'next' || lower.includes('next word')) {
          handleModeChange('vocab');
        }
        return;
      }

      if (mode === 'tips') {
        const tip = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];
        await buddyReply(`Here's another tip:\n\n${tip}`);
        return;
      }

      // Free chat responses
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        await buddyReply("Hello! 😊 How's your English practice going today?");
      } else if (lower.includes('tip') || lower.includes('advice')) {
        const tip = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];
        await buddyReply(`Here's a great tip:\n\n${tip}`);
      } else if (lower.includes('level') || lower.includes('am i')) {
        await buddyReply(
          `Based on your practice, your current level is estimated at **${progress.level}**. You've learned ${progress.wordsLearned} words so far! Keep going — switch to Vocabulary Quiz mode to level up! 🚀`
        );
      } else if (lower.includes('what') && lower.includes('mean')) {
        await buddyReply(
          "Great question! Switch to **Vocabulary Lists** in the sidebar to browse words with definitions, examples, and pronunciation tips. Or ask me to quiz you in Vocabulary Quiz mode!"
        );
      } else if (lower.includes('pronounc')) {
        await buddyReply("Let's practise your pronunciation! Switch to 🎙️ Pronunciation mode above and I'll give you sentences to read aloud.");
      } else if (lower.includes('thank')) {
        await buddyReply("You're very welcome! Keep up the great work! 🌟 Remember: consistent daily practice is the key to fluency.");
      } else if (lower.includes('grammar')) {
        await buddyReply(
          "For grammar practice, try the **Writing Exercise** section! Write a short essay and I'll give you detailed feedback on grammar, vocabulary, and structure."
        );
      } else {
        await buddyReply(
          `Interesting! Let me respond to that... 🤔\n\nBy the way, here's a vocabulary tip: instead of saying "${msg.split(' ').slice(0, 3).join(' ')}…", try using more varied sentence starters like "It is worth noting that…" or "One might argue that…" to sound more sophisticated!`
        );
      }
    },
    [addUserMessage, mode, currentWord, buddyReply, updateProgress, progress, handleModeChange]
  );

  // ── Mic button ─────────────────────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (!supported) {
      setMicWarning('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setMicWarning('');

    if (isListening) {
      stopListening();
      return;
    }

    // Always ask before accessing microphone
    const confirmed = window.confirm(
      '🎙️ English Buddy would like to use your microphone.\n\nThis allows voice input and pronunciation analysis. Click OK to allow, or Cancel to decline.'
    );
    if (!confirmed) {
      setMicWarning('Microphone access was declined. You can still type your messages.');
      return;
    }

    if (mode === 'pronunciation' && currentPronSentence) {
      // Pronunciation mode: compare transcript with expected sentence
      startListening({
        onResult: (result) => {
          const diff = diffWords(currentPronSentence.text, result);
          setPronResult({ expected: currentPronSentence.text, diff, heard: result });
          addUserMessage(`[Voice] "${result}"`);

          const mistakes = diff.filter((w) => w.status !== 'correct');
          if (mistakes.length === 0) {
            buddyReply("🎉 Perfect pronunciation! Every word was clear and correct! Excellent work!");
          } else {
            const wrongWords = mistakes.map((w) => `"${w.word}"`).join(', ');
            buddyReply(
              `Good effort! 👏\n\nI noticed some pronunciation differences in: ${wrongWords}\n\nTip: Focus on the mouth shape and tongue position for each sound. Try saying each word slowly first, then speed up.`
            );
          }
        },
        onEnd: () => {},
      });
    } else {
      // Normal chat mode
      startListening({
        onResult: (result) => {
          handleSend(result);
        },
        onEnd: () => {},
      });
    }
  }, [supported, isListening, stopListening, mode, currentPronSentence, startListening, addUserMessage, buddyReply, handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Chat with Buddy 💬</h1>
        <p>Talk, practise pronunciation, test your vocabulary, and get personalised tips.</p>
      </div>

      <div className="page-body">
        {/* Mode chips */}
        <div className="mode-chips" style={{ marginBottom: 20 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-chip ${mode === m.id ? 'active' : ''}`}
              onClick={() => handleModeChange(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="chat-wrapper">
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg ${msg.sender}`}>
                <div className="msg-avatar">{msg.sender === 'buddy' ? '🎓' : '👤'}</div>
                <div>
                  <div className="msg-bubble">
                  {msg.text.split('\n').map((line, i) => (
                      <p key={`${msg.id}-line-${i}`} dangerouslySetInnerHTML={{ __html: renderBuddyText(line) }} />
                    ))}
                  </div>
                  <div className={`msg-time ${msg.sender}`}>{formatTime(msg.time)}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="msg">
                <div className="msg-avatar">🎓</div>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Pronunciation feedback */}
          {pronResult && (
            <div className="pronunciation-panel" style={{ marginBottom: 12 }}>
              <h4>🎙️ Pronunciation Feedback</h4>
              <div>
                {pronResult.diff.map((w, i) => (
                  <span key={i} className={`pron-word ${w.status}`} title={w.heard ? `Heard: "${w.heard}"` : 'Not heard'}>
                    {w.word}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ✅ correct &nbsp; 🔴 different &nbsp; 🟡 missing &emsp;
                <span style={{ color: 'var(--text-secondary)' }}>You said: "{pronResult.heard}"</span>
              </div>
            </div>
          )}

          {micWarning && (
            <div className="error-banner" style={{ marginBottom: 12 }}>
              {micWarning}
            </div>
          )}

          {/* Input area */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                placeholder={mode === 'pronunciation' ? 'Use the mic button to practise pronunciation…' : 'Type a message or use the mic…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className={`mic-btn ${isListening ? 'recording' : ''}`}
                onClick={handleMicClick}
                title={isListening ? 'Stop recording' : 'Start voice input'}
                aria-label={isListening ? 'Stop recording' : 'Start voice input (microphone)'}
              >
                {isListening ? '⏹️' : '🎙️'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                style={{ height: 48, borderRadius: '50%', width: 48, padding: 0, justifyContent: 'center' }}
              >
                ➤
              </button>
            </div>

            {!supported && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ Speech recognition not available in this browser. Use Chrome or Edge for voice features.
              </div>
            )}

            {isSpeaking && (
              <div style={{ fontSize: '0.78rem', color: 'var(--purple-light)' }}>
                🔊 Buddy is speaking…{' '}
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.78rem' }}
                  onClick={() => window.speechSynthesis?.cancel()}
                >
                  [stop]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

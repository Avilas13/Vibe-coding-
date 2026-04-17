const express = require('express');
const router = express.Router();
const writingTopics = require('../data/writingTopics');

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenize(text) {
  return text.match(/\b\w+\b/g) || [];
}

function getSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

// ── Grammar / Style checks ────────────────────────────────────────────────────

const OVERUSED_WORDS = [
  'very', 'really', 'a lot', 'nice', 'good', 'bad', 'big', 'small',
  'thing', 'stuff', 'got', 'get', 'a lot of',
];

const GRAMMAR_PATTERNS = [
  {
    pattern: /\b(he|she|it|this|that)\s+don't\b/gi,
    message: 'Subject–verb agreement: use "doesn\'t" with he/she/it.',
    type: 'grammar',
  },
  {
    pattern: /\b(i|we|they|you)\s+doesn't\b/gi,
    message: 'Subject–verb agreement: use "don\'t" with I/we/they/you.',
    type: 'grammar',
  },
  {
    pattern: /\b(is|are|was|were)\s+\w+ing\s+by\b/gi,
    message: 'Passive voice detected — consider using the active voice for clarity.',
    type: 'style',
  },
  {
    pattern: /,\s+(and|but|so)\s+[A-Z]/g,
    message: 'A comma before a conjunction + capital letter may indicate a comma splice or a new independent clause.',
    type: 'punctuation',
  },
  {
    pattern: /\b(\w+)\s+\1\b/gi,
    message: 'Duplicate word detected.',
    type: 'grammar',
  },
  {
    pattern: /\bi am agree\b/gi,
    message: '"I am agree" → say "I agree".',
    type: 'grammar',
  },
  {
    pattern: /\bmake\s+a\s+travel\b/gi,
    message: '"Make a travel" → say "go on a trip" or "travel".',
    type: 'grammar',
  },
  {
    pattern: /\bspend\s+time\s+to\s+\w+\b/gi,
    message: '"Spend time to do" → say "spend time doing".',
    type: 'grammar',
  },
  {
    // Flag "look forward to" followed by a bare infinitive (word NOT ending in -ing)
    pattern: /\blook\s+forward\s+to\s+(?!\w+ing\b)\b\w+\b/gi,
    message: 'After "look forward to", use a gerund (-ing form), not a bare infinitive.',
    type: 'grammar',
  },
  {
    pattern: /\bin\s+the\s+other\s+hand\b/gi,
    message: '"In the other hand" → say "on the other hand".',
    type: 'grammar',
  },
  {
    pattern: /\bat\s+the\s+end\s+I\b/gi,
    message: '"At the end I" → say "in the end" for a concluding opinion.',
    type: 'grammar',
  },
  {
    pattern: /\bdespite\s+of\b/gi,
    message: '"Despite of" → just "despite" (no "of").',
    type: 'grammar',
  },
  {
    pattern: /\baccording\s+to\s+my\s+opinion\b/gi,
    message: '"According to my opinion" → say "in my opinion" or "according to experts".',
    type: 'grammar',
  },
];

const TRANSITION_WORDS = [
  'however', 'therefore', 'furthermore', 'moreover', 'consequently',
  'nevertheless', 'although', 'whereas', 'in contrast', 'for instance',
  'for example', 'in addition', 'on the other hand', 'as a result',
  'in conclusion', 'to summarise', 'firstly', 'secondly', 'finally',
];

const VOCABULARY_UPGRADES = {
  good: ['beneficial', 'advantageous', 'commendable', 'exemplary'],
  bad: ['detrimental', 'adverse', 'problematic', 'unfavourable'],
  big: ['substantial', 'considerable', 'significant', 'extensive'],
  small: ['minimal', 'negligible', 'modest', 'limited'],
  nice: ['pleasant', 'agreeable', 'appealing', 'favourable'],
  very: ['extremely', 'remarkably', 'considerably', 'substantially'],
  really: ['genuinely', 'significantly', 'profoundly'],
  show: ['demonstrate', 'illustrate', 'indicate', 'reveal'],
  use: ['utilise', 'employ', 'implement', 'apply'],
  help: ['facilitate', 'assist', 'support', 'contribute to'],
  important: ['significant', 'crucial', 'essential', 'paramount'],
  think: ['consider', 'perceive', 'contend', 'argue'],
  make: ['create', 'produce', 'generate', 'establish'],
};

// ── Main Analysis Function ────────────────────────────────────────────────────

function analyzeWriting(text) {
  const sentences = getSentences(text);
  const words = tokenize(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  const grammarIssues = [];
  const styleIssues = [];
  const vocabularySuggestions = [];

  // ── Grammar checks ─────────────────────────────────────────────────────────
  for (const rule of GRAMMAR_PATTERNS) {
    const matches = [...text.matchAll(rule.pattern)];
    if (matches.length > 0) {
      grammarIssues.push({
        type: rule.type,
        message: rule.message,
        occurrences: matches.map((m) => m[0]),
        severity: rule.type === 'grammar' ? 'high' : 'medium',
      });
    }
  }

  // ── Overused words ─────────────────────────────────────────────────────────
  const lowerText = text.toLowerCase();
  const overusedFound = [];
  for (const w of OVERUSED_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, 'gi');
    const count = (lowerText.match(re) || []).length;
    if (count >= 2) {
      overusedFound.push({ word: w, count });
    }
  }
  if (overusedFound.length > 0) {
    styleIssues.push({
      type: 'vocabulary',
      message: `Overused words detected: ${overusedFound.map((o) => `"${o.word}" (×${o.count})`).join(', ')}. Try more varied alternatives.`,
      severity: 'medium',
    });
  }

  // ── Vocabulary upgrade suggestions ────────────────────────────────────────
  for (const [simpleWord, upgrades] of Object.entries(VOCABULARY_UPGRADES)) {
    const re = new RegExp(`\\b${simpleWord}\\b`, 'gi');
    if (re.test(text)) {
      vocabularySuggestions.push({
        word: simpleWord,
        suggestions: upgrades,
        message: `Consider replacing "${simpleWord}" with a more sophisticated synonym.`,
      });
    }
  }

  // ── Sentence length variety ────────────────────────────────────────────────
  const sentenceLengths = sentences.map((s) => tokenize(s).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceCount || 1);
  const veryShort = sentenceLengths.filter((l) => l < 5).length;
  const veryLong = sentenceLengths.filter((l) => l > 40).length;

  if (veryShort > sentenceCount * 0.4) {
    styleIssues.push({
      type: 'structure',
      message: 'Many sentences are very short. Try combining some using conjunctions or relative clauses.',
      severity: 'medium',
    });
  }
  if (veryLong > 2) {
    styleIssues.push({
      type: 'structure',
      message: 'Some sentences are very long (40+ words). Consider splitting them for clarity.',
      severity: 'medium',
    });
  }

  // ── Transition word usage ──────────────────────────────────────────────────
  const lowerWords = lowerText;
  const usedTransitions = TRANSITION_WORDS.filter((t) => lowerWords.includes(t));
  if (usedTransitions.length < 2 && wordCount > 100) {
    styleIssues.push({
      type: 'cohesion',
      message:
        'Your text uses few transition words. Adding cohesive devices (however, therefore, furthermore, in contrast) will improve flow.',
      severity: 'medium',
    });
  }

  // ── Paragraph check ────────────────────────────────────────────────────────
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length < 2 && wordCount > 100) {
    styleIssues.push({
      type: 'structure',
      message: 'Consider organising your text into clear paragraphs (introduction, body, conclusion).',
      severity: 'low',
    });
  }

  // ── Overall score ──────────────────────────────────────────────────────────
  let score = 100;
  score -= grammarIssues.filter((i) => i.severity === 'high').length * 10;
  score -= grammarIssues.filter((i) => i.severity === 'medium').length * 5;
  score -= styleIssues.filter((i) => i.severity === 'medium').length * 5;
  score -= styleIssues.filter((i) => i.severity === 'low').length * 2;
  score = Math.max(30, Math.min(100, score));

  return {
    wordCount,
    sentenceCount,
    averageSentenceLength: Math.round(avgLength),
    transitionsUsed: usedTransitions,
    grammarIssues,
    styleIssues,
    vocabularySuggestions: vocabularySuggestions.slice(0, 6),
    overallScore: score,
    grade: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Satisfactory' : 'Needs Improvement',
    encouragement:
      score >= 85
        ? 'Outstanding work! Your writing shows excellent command of English.'
        : score >= 70
        ? 'Well done! A few small tweaks will make this even stronger.'
        : score >= 55
        ? 'Good effort! Focus on the grammar and vocabulary suggestions above.'
        : 'Keep practising! Every piece of writing you do will improve your English.',
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/writing/topic?level=B2
router.get('/topic', (req, res) => {
  const raw = (req.query.level || '').toUpperCase();
  const LEVELS = ['B1', 'B2', 'C1', 'C2'];
  const levels = LEVELS.includes(raw) ? [raw] : ['B1', 'B2'];
  const pool = levels.flatMap((l) => writingTopics[l] || []);
  if (!pool.length) return res.status(404).json({ error: 'No topics found.' });
  res.json(pool[Math.floor(Math.random() * pool.length)]);
});

// GET /api/writing/topics  — all topics
router.get('/topics', (req, res) => {
  res.json(writingTopics);
});

// POST /api/writing/analyze
router.post('/analyze', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide at least 10 characters of text.' });
  }
  res.json(analyzeWriting(text));
});

module.exports = router;

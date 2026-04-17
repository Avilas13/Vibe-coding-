# 🎓 English Buddy — Advanced English Learning Webapp

A full-stack AI-powered English learning assistant that helps you improve your vocabulary, pronunciation, and writing from **B1 to C2** level.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Conversation Buddy** | Chat with "Buddy" via text or voice. Get study tips, vocabulary quizzes, and encouragement. |
| 🎙️ **Pronunciation Coach** | Read sentences aloud; the app compares your speech to the expected text word-by-word and highlights mistakes. The browser **always asks for mic permission** before recording. |
| 📚 **B1–C2 Vocabulary Lists** | Browse 40 CEFR-aligned words (10 per level) with phonetics, definitions, examples, tips, common mistakes, and synonyms. Click any word to hear it via text-to-speech. |
| ✍️ **Writing Exercise** | Get a graded writing topic, write your response, and receive instant feedback: grammar issues, style/structure tips, vocabulary upgrade suggestions, and an overall score. |
| 🐙 **GitHub Integration** | Log in with GitHub OAuth. Your learning progress is saved as a private **GitHub Gist** and synced automatically. Works in **demo mode** without credentials too. |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment (optional — for GitHub OAuth)

```bash
cp server/.env.example server/.env
# Edit server/.env and add your GitHub OAuth App credentials
```

> **Without GitHub credentials** the app runs in demo mode — all features work, but progress is saved to `localStorage` instead of a GitHub Gist.

### 3. Start the development servers

```bash
npm run dev
```

This starts:
- **Backend** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## 🐙 Setting up GitHub OAuth (optional)

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL**: `http://localhost:5173`
3. Set **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Copy the **Client ID** and **Client Secret** into `server/.env`

---

## 📁 Project Structure

```
├── client/                 # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── pages/          LandingPage, Dashboard
│       ├── components/     BuddyChat, VocabularySection, WritingExercise
│       ├── hooks/          useSpeech (Web Speech API)
│       └── services/       api.js (Axios)
│
└── server/                 # Express.js backend
    ├── server.js
    ├── routes/             auth, vocabulary, writing, user
    └── data/               vocabulary.js, writingTopics.js
```

---

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Start both servers concurrently |
| `npm run build` | Build the React client for production |
| `npm start` | Start the production server |

---

## 🌐 API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| POST | `/api/auth/demo` | Demo login (no credentials needed) |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/vocabulary/:level` | Get vocabulary for B1/B2/C1/C2 |
| GET | `/api/vocabulary/practice/random` | Random word for quiz |
| GET | `/api/writing/topic?level=B2` | Random writing topic |
| POST | `/api/writing/analyze` | Analyse writing text |
| GET | `/api/user/progress` | Load progress from GitHub Gist |
| POST | `/api/user/progress` | Save progress to GitHub Gist |

---

## 🔊 Browser Requirements

The voice features use the **Web Speech API** (built into the browser — no API key needed):
- **Chrome** or **Edge** recommended for full speech recognition support
- Firefox has limited support; Safari may vary
- The app **always asks for microphone permission** before recording

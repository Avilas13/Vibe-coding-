const express = require('express');
const axios = require('axios');
const router = express.Router();

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────
router.get('/profile', requireAuth, async (req, res) => {
  const user = req.session.user;
  if (user.isDemo) {
    return res.json({
      login: user.login,
      name: user.name,
      avatar_url: null,
      bio: user.bio,
      isDemo: true,
    });
  }

  try {
    const ghRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const { login, name, avatar_url, bio, public_repos, followers } = ghRes.data;
    res.json({ login, name, avatar_url, bio, public_repos, followers, isDemo: false });
  } catch (err) {
    console.error('GitHub profile fetch error:', err.message);
    res.json({ login: user.login, name: user.name, avatar_url: user.avatar_url, isDemo: false });
  }
});

// ── GET /api/user/progress — load progress from Gist ─────────────────────────
router.get('/progress', requireAuth, async (req, res) => {
  const user = req.session.user;

  // Demo users: no Gist, return null
  if (user.isDemo || !user.access_token) {
    return res.json({ progress: null });
  }

  try {
    // Check if we already stored the Gist ID in the session
    if (user.progressGistId) {
      const gistRes = await axios.get(`https://api.github.com/gists/${user.progressGistId}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const content = gistRes.data.files['english-buddy-progress.json']?.content;
      return res.json({ progress: content ? JSON.parse(content) : null, gistId: user.progressGistId });
    }

    // Search existing gists for our file
    const gistsRes = await axios.get('https://api.github.com/gists?per_page=100', {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const existing = gistsRes.data.find(
      (g) => g.description === 'English Buddy – Learning Progress' || g.files['english-buddy-progress.json']
    );

    if (existing) {
      req.session.user.progressGistId = existing.id;
      const gistRes = await axios.get(`https://api.github.com/gists/${existing.id}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const content = gistRes.data.files['english-buddy-progress.json']?.content;
      return res.json({ progress: content ? JSON.parse(content) : null, gistId: existing.id });
    }

    res.json({ progress: null });
  } catch (err) {
    console.error('Progress fetch error:', err.message);
    res.json({ progress: null });
  }
});

// ── POST /api/user/progress — save progress to Gist ──────────────────────────
router.post('/progress', requireAuth, async (req, res) => {
  const { progress } = req.body;
  const user = req.session.user;

  if (user.isDemo || !user.access_token) {
    return res.json({ success: true, message: 'Progress noted (demo mode — stored in browser).' });
  }

  const gistPayload = {
    description: 'English Buddy – Learning Progress',
    public: false,
    files: {
      'english-buddy-progress.json': {
        content: JSON.stringify(progress, null, 2),
      },
    },
  };

  try {
    let gistId = user.progressGistId;
    let response;

    if (gistId) {
      response = await axios.patch(`https://api.github.com/gists/${gistId}`, gistPayload, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
    } else {
      response = await axios.post('https://api.github.com/gists', gistPayload, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      req.session.user.progressGistId = response.data.id;
    }

    res.json({ success: true, gistId: response.data.id });
  } catch (err) {
    console.error('Progress save error:', err.message);
    res.status(500).json({ error: 'Failed to save progress to GitHub Gist.' });
  }
});

module.exports = router;

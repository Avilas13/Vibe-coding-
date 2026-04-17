const express = require('express');
const axios = require('axios');
const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Redirect to GitHub OAuth ──────────────────────────────────────────────────
router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.redirect(`${CLIENT_URL}/?error=github_not_configured`);
  }
  const scope = 'read:user,gist';
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}`;
  res.redirect(authUrl);
});

// ── GitHub OAuth callback ─────────────────────────────────────────────────────
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${CLIENT_URL}/?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenRes.data;
    if (!access_token) {
      return res.redirect(`${CLIENT_URL}/?error=no_token`);
    }

    // Fetch GitHub user profile
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const u = userRes.data;
    req.session.user = {
      id: u.id,
      login: u.login,
      name: u.name || u.login,
      avatar_url: u.avatar_url,
      bio: u.bio || '',
      access_token,
      isDemo: false,
    };

    res.redirect(`${CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error('GitHub OAuth error:', err.message);
    res.redirect(`${CLIENT_URL}/?error=auth_failed`);
  }
});

// ── Demo / guest login ────────────────────────────────────────────────────────
router.post('/demo', (req, res) => {
  req.session.user = {
    id: 'demo-' + Date.now(),
    login: 'guest_learner',
    name: 'Guest Learner',
    avatar_url: null,
    bio: 'Exploring English Buddy in demo mode!',
    isDemo: true,
  };
  res.json({ success: true, user: req.session.user });
});

// ── Current session user ──────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (req.session.user) {
    const { access_token, ...safe } = req.session.user; // don't expose token
    res.json({ user: safe });
  } else {
    res.json({ user: null });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

module.exports = router;

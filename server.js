require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getClient, EXTRACT_PROMPT, buildFileMessageContent, extractFindings } = require('./api/_lib/extract');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// ── /api/analyze-file ─────────────────────────────────────────────────────

app.post('/api/analyze-file', async (req, res) => {
  try {
    // Validate API key first — gives a clean error rather than an SDK exception
    getClient();

    const { dataUrl, mimeType, fileName } = req.body;
    if (!dataUrl || !mimeType) return res.status(400).json({ error: 'dataUrl and mimeType required' });

    const messageContent = buildFileMessageContent(dataUrl, mimeType, fileName);
    const findings = await extractFindings('analyze-file', messageContent);
    res.json({ findings });

  } catch (err) {
    console.error('[analyze-file]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── /api/analyze-text ─────────────────────────────────────────────────────
// Same extraction, but for text pasted directly into the app (no file involved).

app.post('/api/analyze-text', async (req, res) => {
  try {
    getClient();

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });

    const messageContent = [
      { type: 'text', text: `Pasted text:\n${text}\n\n${EXTRACT_PROMPT}` },
    ];

    const findings = await extractFindings('analyze-text', messageContent);
    res.json({ findings });

  } catch (err) {
    console.error('[analyze-text]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/analyze-url ──────────────────────────────────────────────────────
// Fetches a public page server-side (sidesteps browser CORS) and extracts
// findings from its visible text. Pages that require login (most dating
// apps) generally can't be reached this way — the client should suggest
// copy/pasting the text instead.

app.post('/api/analyze-url', async (req, res) => {
  try {
    getClient();

    const { url } = req.body;
    if (!url || !url.trim()) return res.status(400).json({ error: 'url required' });

    let parsed;
    try {
      parsed = new URL(url.trim());
    } catch (_) {
      return res.status(400).json({ error: 'That doesn\'t look like a valid URL.' });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }

    console.log(`[analyze-url] fetching: ${parsed.href}`);

    let html;
    try {
      const pageRes = await fetch(parsed.href, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DateBaseBot/1.0)' },
      });
      if (!pageRes.ok) {
        return res.status(502).json({ error: `That page returned an error (${pageRes.status}). It may require login — try pasting the text instead.` });
      }
      html = await pageRes.text();
    } catch (fetchErr) {
      console.error('[analyze-url] fetch failed:', fetchErr.message);
      return res.status(502).json({ error: 'Could not load that page. It may block automated access — try pasting the text instead.' });
    }

    // Crude tag-strip → visible text. Good enough for extraction; not a real HTML parser.
    const pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000);

    if (!pageText) return res.json({ findings: [] });

    const messageContent = [
      { type: 'text', text: `Page URL: ${parsed.href}\n\nPage content:\n${pageText}\n\n${EXTRACT_PROMPT}` },
    ];

    const findings = await extractFindings('analyze-url', messageContent);
    res.json({ findings });

  } catch (err) {
    console.error('[analyze-url]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.API_PORT || 3002;
app.listen(PORT, () => {
  console.log(`\n✅  DateBase API server → http://localhost:${PORT}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ missing — add it to .env'}\n`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Lazily resolve the client so the key is read at request time,
// not at module load — makes restarting after editing .env unnecessary.
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith('sk-ant-YOUR') || key.endsWith('...')) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add your real key to date-base/.env and restart the server.');
  }
  return new Anthropic({ apiKey: key });
}

// ── Extraction prompt ─────────────────────────────────────────────────────

const EXTRACT_PROMPT = `Extract all useful information about this person for a dating profile tracker.

Return ONLY a valid JSON array — no markdown fences, no explanation, just the raw JSON.
Each item must follow one of these shapes:
  { "label": "Name",       "type": "fact",      "value": "Jane Smith"              }
  { "label": "Interests",  "type": "interests", "value": ["hiking", "wine"]        }

Field types to extract when present:
  Name, Age, Occupation, Location, Bio / About, Height, Looking For, Interests (→ use type "interests"),
  Personality traits, Green flags, First impression, Notable facts, Conversation highlights,
  Relationship goals, Any other detail worth remembering.

Only include fields with clear evidence in the content. Do not invent anything.`;

// ── Shared: send content to Claude and parse the findings JSON array ───────

async function extractFindings(tag, messageContent) {
  const message = await getClient().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 16000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: messageContent }],
  });

  // Find the text block — content may include non-text blocks (e.g. tool_use)
  const textBlock = message.content.find(b => b.type === 'text');
  console.log(`[${tag}] content blocks:`, message.content.map(b => b.type));
  if (!textBlock || !textBlock.text) {
    console.log(`[${tag}] no text block found`);
    return [];
  }

  const raw = textBlock.text.trim();
  console.log(`[${tag}] raw response (first 500):`, raw.slice(0, 500));

  // Pull out the JSON array even if the model wraps it in prose
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    console.log(`[${tag}] no JSON array found in response`);
    return [];
  }

  // Parse — LLMs sometimes emit trailing commas or minor formatting issues
  let raw_findings;
  try {
    raw_findings = JSON.parse(match[0]);
  } catch (_) {
    // Strip trailing commas before ] or } and retry
    const cleaned = match[0]
      .replace(/,(\s*[}\]])/g, '$1')   // trailing commas
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // unquoted keys
    try {
      raw_findings = JSON.parse(cleaned);
    } catch (e2) {
      console.error(`[${tag}] JSON parse failed:`, e2.message, '\nRaw:', match[0].slice(0, 200));
      return [];
    }
  }

  return raw_findings
    .filter(f => f && f.label != null && f.value != null)
    .map(f => ({
      label: String(f.label),
      type: f.type === 'interests' ? 'interests' : 'fact',
      value: f.type === 'interests'
        ? (Array.isArray(f.value) ? f.value.map(String).filter(Boolean) : String(f.value).split(',').map(s => s.trim()).filter(Boolean))
        : String(f.value),
    }));
}

// ── /api/analyze-file ─────────────────────────────────────────────────────

app.post('/api/analyze-file', async (req, res) => {
  try {
    // Validate API key first — gives a clean error rather than an SDK exception
    getClient();

    const { dataUrl, mimeType, fileName } = req.body;
    if (!dataUrl || !mimeType) return res.status(400).json({ error: 'dataUrl and mimeType required' });

    // Strip the Data-URL header → pure base64
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) return res.status(400).json({ error: 'Invalid dataUrl — no base64 payload found' });

    const approxMB = (base64Data.length * 0.75 / 1024 / 1024).toFixed(1);
    console.log(`[analyze-file] file: "${fileName}" mime: ${mimeType} size: ~${approxMB}MB base64len: ${base64Data.length}`);

    let messageContent;

    if (mimeType.startsWith('image/')) {
      // Normalize HEIC/HEIF → JPEG (API doesn't accept HEIC directly)
      const apiMime = (mimeType === 'image/heic' || mimeType === 'image/heif')
        ? 'image/jpeg'
        : mimeType;
      messageContent = [
        { type: 'image', source: { type: 'base64', media_type: apiMime, data: base64Data } },
        { type: 'text',  text: `File: "${fileName}"\n\n${EXTRACT_PROMPT}` },
      ];

    } else if (mimeType === 'application/pdf') {
      messageContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
        { type: 'text',     text: `File: "${fileName}"\n\n${EXTRACT_PROMPT}` },
      ];

    } else {
      // Plain text / RTF / CSV — decode to UTF-8 and send as text
      const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
      messageContent = [
        { type: 'text', text: `File: "${fileName}"\n\nContent:\n${textContent}\n\n${EXTRACT_PROMPT}` },
      ];
    }

    const findings = await extractFindings('analyze-file', messageContent);
    res.json({ findings });

  } catch (err) {
    console.error('[analyze-file]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/analyze-text ─────────────────────────────────────────────────────
// Same extraction, but for text pasted directly into the app (no file involved).

app.post('/api/analyze-text', async (req, res) => {
  try {
    getClient();

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });

    console.log(`[analyze-text] length: ${text.length}`);

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

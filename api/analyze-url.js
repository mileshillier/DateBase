// Vercel Serverless Function: POST /api/analyze-url
//
// Fetches a public page server-side (sidesteps browser CORS) and extracts
// findings from its visible text. Pages that require login (most dating
// apps) generally can't be reached this way — the client suggests
// copy/pasting the text instead when nothing comes back.
const { EXTRACT_PROMPT, extractFindings } = require('./_lib/extract');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body || {};
    if (!url || !url.trim()) {
      res.status(400).json({ error: 'url required' });
      return;
    }

    let parsed;
    try {
      parsed = new URL(url.trim());
    } catch (_) {
      res.status(400).json({ error: 'That doesn\'t look like a valid URL.' });
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'URL must start with http:// or https://' });
      return;
    }

    let html;
    try {
      const pageRes = await fetch(parsed.href, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DateBaseBot/1.0)' },
      });
      if (!pageRes.ok) {
        res.status(502).json({ error: `That page returned an error (${pageRes.status}). It may require login — try pasting the text instead.` });
        return;
      }
      html = await pageRes.text();
    } catch (fetchErr) {
      console.error('[analyze-url] fetch failed:', fetchErr.message);
      res.status(502).json({ error: 'Could not load that page. It may block automated access — try pasting the text instead.' });
      return;
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

    if (!pageText) {
      res.status(200).json({ findings: [] });
      return;
    }

    const messageContent = [
      { type: 'text', text: `Page URL: ${parsed.href}\n\nPage content:\n${pageText}\n\n${EXTRACT_PROMPT}` },
    ];

    const findings = await extractFindings('analyze-url', messageContent);
    res.status(200).json({ findings });

  } catch (err) {
    console.error('[analyze-url]', err.message);
    res.status(500).json({ error: err.message });
  }
};

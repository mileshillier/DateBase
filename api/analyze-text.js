// Vercel Serverless Function: POST /api/analyze-text
const { EXTRACT_PROMPT, extractFindings } = require('./_lib/extract');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'text required' });
      return;
    }

    const messageContent = [
      { type: 'text', text: `Pasted text:\n${text}\n\n${EXTRACT_PROMPT}` },
    ];

    const findings = await extractFindings('analyze-text', messageContent);
    res.status(200).json({ findings });

  } catch (err) {
    console.error('[analyze-text]', err.message);
    res.status(500).json({ error: err.message });
  }
};

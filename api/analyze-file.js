// Vercel Serverless Function: POST /api/analyze-file
const { buildFileMessageContent, extractFindings } = require('./_lib/extract');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { dataUrl, mimeType, fileName } = req.body || {};
    if (!dataUrl || !mimeType) {
      res.status(400).json({ error: 'dataUrl and mimeType required' });
      return;
    }

    const messageContent = buildFileMessageContent(dataUrl, mimeType, fileName);
    const findings = await extractFindings('analyze-file', messageContent);
    res.status(200).json({ findings });

  } catch (err) {
    console.error('[analyze-file]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

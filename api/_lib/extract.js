// Shared extraction logic used by both:
//  - server.js (Express, for local dev via `npm run server`)
//  - the Vercel Serverless Functions in api/*.js (for the deployed site)
//
// Files/dirs under api/ that start with "_" are not treated as routes by
// Vercel, so this module is safe to keep alongside the function files.

const Anthropic = require('@anthropic-ai/sdk');

// Lazily resolve the client so the key is read at request time.
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith('sk-ant-YOUR') || key.endsWith('...')) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add your real key to .env (local) or ' +
      'the project\'s Environment Variables in Vercel (deployed), then restart/redeploy.'
    );
  }
  return new Anthropic({ apiKey: key });
}

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

// Builds the Claude message content for a file (image / PDF / plain text), given
// a data: URL. Shared so /api/analyze-file behaves identically locally and deployed.
function buildFileMessageContent(dataUrl, mimeType, fileName) {
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) {
    const err = new Error('Invalid dataUrl — no base64 payload found');
    err.status = 400;
    throw err;
  }

  if (mimeType.startsWith('image/')) {
    // Normalize HEIC/HEIF → JPEG (API doesn't accept HEIC directly)
    const apiMime = (mimeType === 'image/heic' || mimeType === 'image/heif') ? 'image/jpeg' : mimeType;
    return [
      { type: 'image', source: { type: 'base64', media_type: apiMime, data: base64Data } },
      { type: 'text',  text: `File: "${fileName}"\n\n${EXTRACT_PROMPT}` },
    ];
  }

  if (mimeType === 'application/pdf') {
    return [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
      { type: 'text',     text: `File: "${fileName}"\n\n${EXTRACT_PROMPT}` },
    ];
  }

  // Plain text / RTF / CSV — decode to UTF-8 and send as text
  const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
  return [
    { type: 'text', text: `File: "${fileName}"\n\nContent:\n${textContent}\n\n${EXTRACT_PROMPT}` },
  ];
}

// Sends content to Claude and parses the findings JSON array out of the reply.
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

module.exports = { getClient, EXTRACT_PROMPT, buildFileMessageContent, extractFindings };

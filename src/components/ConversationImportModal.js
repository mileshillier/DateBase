import { useState, useRef } from 'react';
import { parseConversation, nextId } from '../data/profiles';

const FIELD_STYLE = {
  width: '100%', background: '#F5F5F5', border: '1px solid #E8E8E8',
  borderRadius: 12, padding: '12px 14px', color: '#111111', fontSize: 13,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, color: '#888888',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block',
};

// ── Supported file types ──────────────────────────────────────────────────
const ACCEPT = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.apple.pages',
  'application/rtf', 'text/rtf',
].join(',');

const ACCEPT_LABEL = 'JPG, PNG, GIF, WEBP, HEIC · PDF · DOC, DOCX · TXT · RTF';

function getFileKind(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('text/')) return 'text';
  return 'doc';
}

const FILE_KIND_ICON = { image: '🖼️', pdf: '📄', text: '📝', doc: '📝' };
const FILE_KIND_COLOR = { image: '#7A3AC8', pdf: '#7A2848', text: '#2A8A5A', doc: '#2A8A5A' };

// ── File analysis via local API server ───────────────────────────────────
// Proxied through CRA dev server → http://localhost:3002/api/analyze-file
// Run the server with: npm run server  (needs ANTHROPIC_API_KEY in .env)

async function analyzeFile(dataUrl, file) {
  let res;
  try {
    res = await fetch('/api/analyze-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, mimeType: file.type, fileName: file.name }),
    });
  } catch (_) {
    throw new Error('Cannot reach API server. Run: npm run server (in the date-base folder)');
  }

  // If CRA proxy isn't active yet, it returns an HTML error page
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(
      res.status === 404
        ? 'Proxy not active — restart the React dev server (npm start) then try again'
        : `Unexpected response (${res.status}). Make sure npm run server is running`
    );
  }

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Server error ${res.status}`);
  return body.findings ?? [];
}

// ── Checkbox row ─────────────────────────────────────────────────────────

function FindingRow({ finding, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
        background: checked ? '#F0F0F0' : '#F8F8F8',
        border: checked ? '1px solid #CCCCCC' : '1px solid #EEEEEE',
        transition: 'background 0.1s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
        border: checked ? '2px solid #888888' : '2px solid #CCCCCC',
        background: checked ? '#888888' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {finding.label}
        </span>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: '#444444', lineHeight: 1.45 }}>
          {finding.type === 'interests'
            ? (Array.isArray(finding.value) ? finding.value.join(', ') : String(finding.value ?? ''))
            : String(finding.value ?? '')}
        </p>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────

export function ConversationImportModal({ profiles, preselectedProfileId, onImport, onClose }) {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const [profileId, setProfileId] = useState(preselectedProfileId || (sorted.length === 1 ? sorted[0].id : ''));
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null); // { dataUrl, name, type, kind }
  const [step, setStep] = useState('compose'); // 'compose' | 'analyzing' | 'review'
  const [findings, setFindings] = useState([]);
  const [selected, setSelected] = useState({});
  const [apiError, setApiError] = useState(null);
  const fileRef = useRef(null);

  const canExtract = (text.trim().length > 0 || attachment !== null) && profileId;

  // ── Handlers ─────────────────────────────────────────────────────────

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAttachment({
      dataUrl: ev.target.result,
      name: file.name,
      type: file.type,
      kind: getFileKind(file),
      file,
    });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleExtract() {
    if (!canExtract) return;
    setApiError(null);
    setStep('analyzing');

    try {
      const allFindings = [];

      if (text.trim()) {
        allFindings.push(...parseConversation(text));
      }

      if (attachment) {
        const fileFindings = await analyzeFile(attachment.dataUrl, attachment.file);
        allFindings.push(...fileFindings);
      }

      const sel = {};
      allFindings.forEach((_, i) => { sel[i] = true; });
      setFindings(allFindings);
      setSelected(sel);
      setStep('review');
    } catch (err) {
      const isNetwork = err.message.includes('fetch') || err.message.includes('Failed to fetch');
      setApiError(isNetwork
        ? 'API server not running. In a terminal: cd date-base && npm run server'
        : err.message);
      setStep('compose');
    }
  }

  function handleApply() {
    if (!profileId || findings.length === 0) return;
    const highlights = [];
    const newInterests = [];

    findings.forEach((f, i) => {
      if (!selected[i] || f.value == null) return;
      if (f.type === 'interests') {
        const items = Array.isArray(f.value) ? f.value : [String(f.value)];
        newInterests.push(...items.filter(Boolean));
      } else {
        const text = String(f.value);
        if (!text) return;
        highlights.push({
          id: nextId(),
          text,
          label: f.label,
          source: attachment ? 'File import' : 'Text import',
          date: new Date().toISOString().split('T')[0],
        });
      }
    });

    onImport(profileId, highlights, newInterests);
    onClose();
  }

  function toggleItem(i) {
    setSelected(s => ({ ...s, [i]: !s[i] }));
  }

  const anySelected = Object.values(selected).some(Boolean);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#FFFFFF', borderRadius: 20,
        border: '1px solid #E8E8E8',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111111' }}>
              {step === 'review' ? 'Review Findings' : 'Import Info'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#AAAAAA', lineHeight: 1.4 }}>
              {step === 'review'
                ? 'Select what to save to the profile'
                : 'Paste text or attach a file — we\'ll extract the key details'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: '#F5F5F5', border: '1px solid #E8E8E8',
            color: '#666666', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── ANALYZING STATE ──────────────────────────────── */}
          {step === 'analyzing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid #E8E8E8', borderTopColor: '#7A2848',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#555555' }}>Analyzing your import…</p>
              <p style={{ margin: 0, fontSize: 12, color: '#AAAAAA' }}>Extracting names, facts, interests, and highlights</p>
            </div>
          )}

          {/* ── REVIEW STATE ─────────────────────────────────── */}
          {step === 'review' && (
            <>
              {findings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 12 }}>🔍</div>
                  <p style={{ margin: 0, fontSize: 14, color: '#999999' }}>Nothing extracted — try a longer text or a different file</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {findings.map((f, i) => (
                    <FindingRow key={i} finding={f} checked={!!selected[i]} onToggle={() => toggleItem(i)} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setStep('compose'); setFindings([]); setSelected({}); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', color: '#666666', border: '1px solid #E8E8E8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  ← Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={!anySelected}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 14,
                    background: anySelected ? 'linear-gradient(135deg, #7A2848 0%, #5C1D37 100%)' : '#F5F5F5',
                    color: anySelected ? '#FFFFFF' : '#AAAAAA',
                    border: 'none', cursor: anySelected ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 700,
                    boxShadow: anySelected ? '0 4px 16px rgba(122,40,72,0.3)' : 'none',
                  }}>
                  Apply to Profile
                </button>
              </div>
            </>
          )}

          {/* ── COMPOSE STATE ────────────────────────────────── */}
          {step === 'compose' && (
            <>
              {/* Error banner */}
              {apiError && (
                <div style={{
                  background: '#F6EBEF', border: '1px solid rgba(122,40,72,0.25)',
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: 12, color: '#7A2848', lineHeight: 1.5 }}>{apiError}</p>
                </div>
              )}

              {/* Profile picker (only if not preselected) */}
              {!preselectedProfileId && (
                <div>
                  <label style={LABEL_STYLE}>Which person?</label>
                  <div style={{ position: 'relative' }}>
                    <select value={profileId} onChange={e => setProfileId(e.target.value)}
                      style={{ ...FIELD_STYLE, appearance: 'none', paddingRight: 36 }}>
                      <option value="">Select a person…</option>
                      {sorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none' }}>▾</span>
                  </div>
                </div>
              )}

              {/* Paste text */}
              <div>
                <label style={LABEL_STYLE}>Paste text</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Paste a conversation, bio, notes, or any text about this person…"
                  rows={6}
                  style={{ ...FIELD_STYLE, resize: 'none', lineHeight: 1.6 }}
                />
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#EEEEEE' }} />
                <span style={{ fontSize: 11, color: '#CCCCCC', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#EEEEEE' }} />
              </div>

              {/* File upload */}
              <div>
                <label style={LABEL_STYLE}>Add a file</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {attachment ? (
                  <div style={{ position: 'relative' }}>
                    {attachment.kind === 'image' ? (
                      <img
                        src={attachment.dataUrl}
                        alt="File preview"
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #E8E8E8', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', borderRadius: 12,
                        border: `1.5px solid ${FILE_KIND_COLOR[attachment.kind]}30`,
                        background: `${FILE_KIND_COLOR[attachment.kind]}08`,
                      }}>
                        <span style={{ fontSize: 28, lineHeight: 1 }}>{FILE_KIND_ICON[attachment.kind]}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachment.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {attachment.kind === 'pdf' ? 'PDF Document' : attachment.kind === 'doc' ? 'Document' : 'Text file'}
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setAttachment(null)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.50)', color: '#FFFFFF',
                        border: 'none', cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: '100%', padding: '20px 16px', borderRadius: 14,
                      border: '2px dashed #E0E0E0', background: '#FAFAFA',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8,
                    }}
                  >
                    {/* Upload icon */}
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#888888' }}>Click to upload a file</span>
                    <span style={{ fontSize: 11, color: '#BBBBBB', textAlign: 'center', lineHeight: 1.5 }}>
                      {ACCEPT_LABEL}
                    </span>
                  </button>
                )}
              </div>

              {/* Extract button */}
              <button
                type="button"
                onClick={handleExtract}
                disabled={!canExtract}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: canExtract
                    ? 'linear-gradient(135deg, #7A2848 0%, #5C1D37 100%)'
                    : '#F5F5F5',
                  color: canExtract ? '#FFFFFF' : '#AAAAAA',
                  cursor: canExtract ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
                  boxShadow: canExtract ? '0 4px 16px rgba(122,40,72,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ✦ Extract & Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

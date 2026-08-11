import { useState, useRef } from 'react';
import { nextId, MET_ON_OPTIONS, LOOKING_FOR_OPTIONS, INTEREST_TAGS, AVATAR_COLORS } from '../data/profiles';

const FIELD_STYLE = {
  width: '100%', background: '#F5F5F5', border: '1px solid #E8E8E8',
  borderRadius: 12, padding: '12px 14px', color: '#111111', fontSize: 14,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, color: '#888888',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block',
};

const PRIMARY_BTN_STYLE = (enabled) => ({
  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
  background: enabled ? 'linear-gradient(135deg, #7A2848 0%, #5C1D37 100%)' : '#F5F5F5',
  color: enabled ? '#FFFFFF' : '#AAAAAA',
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
  boxShadow: enabled ? '0 4px 16px rgba(122,40,72,0.3)' : 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});

const ACCEPT = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf', 'text/rtf',
].join(',');

async function callApi(path, payload) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    throw new Error('Cannot reach API server. Run: npm run server');
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Server error (${res.status}). Make sure npm run server is running.`);
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Server error ${res.status}`);
  return body.findings ?? [];
}

const analyzeFile = (dataUrl, file) => callApi('/api/analyze-file', { dataUrl, mimeType: file.type, fileName: file.name });
const analyzeText = (text) => callApi('/api/analyze-text', { text });
const analyzeUrl  = (url)  => callApi('/api/analyze-url', { url });

// Map extracted findings onto form fields
function applyFindings(findings, setForm) {
  const updates = {};
  const noteParts = [];

  for (const f of findings) {
    const lbl = (f.label || '').toLowerCase();
    const val = f.value;

    if (lbl === 'name' && val) {
      updates.name = String(val);
    } else if (lbl === 'age' && val) {
      const n = parseInt(val);
      if (!isNaN(n)) updates.age = String(n);
    } else if (lbl === 'height' && val) {
      updates.height = String(val);
    } else if (lbl === 'occupation' && val) {
      updates.occupation = String(val);
    } else if (lbl === 'location' && val) {
      updates.location = String(val);
    } else if (lbl.includes('looking for') && val) {
      const match = LOOKING_FOR_OPTIONS.find(o =>
        String(val).toLowerCase().includes(o.toLowerCase()) || o.toLowerCase().includes(String(val).toLowerCase())
      );
      if (match) updates.lookingFor = match;
    } else if (f.type === 'interests' && Array.isArray(val) && val.length) {
      // Match against known interest tags (case-insensitive)
      const matched = val.filter(v =>
        INTEREST_TAGS.some(t => t.toLowerCase() === String(v).toLowerCase())
      );
      // Also try partial/fuzzy matches for unrecognized interests
      const unmatched = val.filter(v =>
        !INTEREST_TAGS.some(t => t.toLowerCase() === String(v).toLowerCase())
      );
      const fuzzy = unmatched.flatMap(v =>
        INTEREST_TAGS.filter(t => t.toLowerCase().includes(String(v).toLowerCase()) || String(v).toLowerCase().includes(t.toLowerCase()))
      );
      const all = [...new Set([...matched, ...fuzzy])];
      if (all.length) updates.interests = all;
    } else if (lbl.includes('first impression') && val) {
      updates.firstImpression = String(val);
    } else if (lbl.includes('green flag') && val) {
      updates.greenFlags = Array.isArray(val) ? val.join(', ') : String(val);
    } else if (lbl.includes('red flag') && val) {
      updates.redFlags = Array.isArray(val) ? val.join(', ') : String(val);
    } else if (lbl.includes('bio') || lbl.includes('about') || lbl.includes('note') ||
               lbl.includes('fact') || lbl.includes('highlight') || lbl.includes('trait') ||
               lbl.includes('personality') || lbl.includes('relationship goal')) {
      const text = Array.isArray(val) ? val.join(', ') : String(val);
      if (text) noteParts.push(`${f.label}: ${text}`);
    }
  }

  if (noteParts.length) {
    updates.notes = noteParts.join('\n\n');
  }

  setForm(f => ({ ...f, ...updates }));
}

function PillSelect({ options, value, onChange, multi = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const selected = multi ? (value || []).includes(opt) : value === opt;
        return (
          <button key={opt} type="button"
            onClick={() => {
              if (multi) {
                const cur = value || [];
                onChange(selected ? cur.filter(v => v !== opt) : [...cur, opt]);
              } else {
                onChange(selected ? '' : opt);
              }
            }}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: selected ? '1.5px solid #7A2848' : '1.5px solid #E8E8E8',
              background: selected ? 'rgba(122,40,72,0.08)' : 'transparent',
              color: selected ? '#7A2848' : '#666666',
              cursor: 'pointer',
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px', borderRadius: 16,
      background: '#F9F7F5', border: '1px solid #E8E8E8',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'rgba(122,40,72,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ color: '#CCCCCC', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  );
}

function ErrorBanner({ children }) {
  return (
    <div style={{
      background: '#FEF5F5', border: '1px solid #F0CCCC',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <p style={{ margin: 0, fontSize: 12, color: '#C04040', lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

function DoneBanner({ label, onRetry, onContinue }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '10px 14px', borderRadius: 12,
        background: '#F0FAF4', border: '1px solid #B8E0C8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 13, color: '#2A8A5A', fontWeight: 500 }}>✓ Pre-filled from {label}</span>
        <button type="button" onClick={onRetry} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#888888', fontSize: 11, padding: 0, flexShrink: 0,
        }}>Try another</button>
      </div>
      <button type="button" onClick={onContinue} style={PRIMARY_BTN_STYLE(true)}>
        Continue to details →
      </button>
    </div>
  );
}

function SkipManualLink({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#999999', fontSize: 12, fontWeight: 500, padding: '2px 0',
      textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: 2,
    }}>
      or enter details manually
    </button>
  );
}

const MODE_META = {
  choose: { title: 'New Profile', subtitle: 'How would you like to add them?' },
  url:    { title: 'From a URL', subtitle: "We'll pull what we can from the page" },
  import: { title: 'Import', subtitle: "Upload a file or paste text — we'll extract the details" },
  manual: { title: 'New Profile', subtitle: null },
};

export function AddProfileModal({ onAdd, onClose }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'url' | 'import' | 'manual'
  const [step, setStep] = useState(1); // manual sub-step: 1 | 2
  const [form, setForm] = useState({
    name: '', age: '', photo: '', location: '', occupation: '',
    height: '', lookingFor: '', metOn: '',
    interests: [], greenFlags: '', redFlags: '', firstImpression: '', notes: '',
  });

  // Import state (file upload or pasted text)
  const [importTab, setImportTab] = useState('file'); // 'file' | 'paste'
  const [importStatus, setImportStatus] = useState(null); // null | 'analyzing' | 'done' | 'error'
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const importFileRef = useRef(null);

  // URL state
  const [urlValue, setUrlValue] = useState('');
  const [urlStatus, setUrlStatus] = useState(null); // null | 'analyzing' | 'done' | 'error'
  const [urlError, setUrlError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function resetImport() {
    setImportStatus(null);
    setImportName('');
    setImportError('');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';

    setImportStatus('analyzing');
    setImportName(file.name);
    setImportError('');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const findings = await analyzeFile(ev.target.result, file);
        if (!findings.length) {
          setImportStatus('error');
          setImportError('Nothing extracted — try a different file or fill in manually.');
          return;
        }
        applyFindings(findings, setForm);
        setImportStatus('done');
      } catch (err) {
        setImportStatus('error');
        setImportError(err.message);
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportError('Could not read file.');
    };
    reader.readAsDataURL(file);
  }

  async function handlePasteExtract() {
    if (!pasteText.trim()) return;

    setImportStatus('analyzing');
    setImportName('pasted text');
    setImportError('');

    try {
      const findings = await analyzeText(pasteText);
      if (!findings.length) {
        setImportStatus('error');
        setImportError('Nothing extracted — try more detail or fill in manually.');
        return;
      }
      applyFindings(findings, setForm);
      setImportStatus('done');
    } catch (err) {
      setImportStatus('error');
      setImportError(err.message);
    }
  }

  async function handleUrlExtract() {
    if (!urlValue.trim()) return;

    setUrlStatus('analyzing');
    setUrlError('');

    try {
      const findings = await analyzeUrl(urlValue.trim());
      if (!findings.length) {
        setUrlStatus('error');
        setUrlError('Nothing extracted — the page may require login. Try pasting the text instead.');
        return;
      }
      applyFindings(findings, setForm);
      setUrlStatus('done');
    } catch (err) {
      setUrlStatus('error');
      setUrlError(err.message);
    }
  }

  function handleHeaderBack() {
    if (mode === 'manual' && step === 2) { setStep(1); return; }
    setMode('choose');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const greenArr = form.greenFlags
      ? form.greenFlags.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const redArr = form.redFlags
      ? form.redFlags.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newProfile = {
      id: nextId(),
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : null,
      photo: form.photo.trim() || null,
      location: form.location.trim(),
      occupation: form.occupation.trim(),
      height: form.height.trim(),
      lookingFor: form.lookingFor,
      metOn: form.metOn,
      status: 'prospect',
      vibe: 0,
      avatarColor: Math.floor(Math.random() * AVATAR_COLORS.length),
      interests: form.interests,
      greenFlags: greenArr,
      redFlags: redArr,
      dealbreakers: [],
      firstImpression: form.firstImpression.trim(),
      notes: form.notes.trim(),
      interactions: [],
      conversationHighlights: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onAdd(newProfile);
    onClose();
  }

  const meta = MODE_META[mode];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 540,
        background: '#FFFFFF', borderRadius: 20,
        border: '1px solid #E8E8E8',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {mode !== 'choose' && (
              <button type="button" onClick={handleHeaderBack} style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: '#F5F5F5', border: '1px solid #E8E8E8',
                color: '#666666', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>‹</button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111111', fontFamily: "'DM Sans', sans-serif" }}>
                {meta.title}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888888' }}>
                {mode === 'manual' ? `Step ${step} of 2` : meta.subtitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: '#F5F5F5', border: '1px solid #E8E8E8',
            color: '#666666', cursor: 'pointer', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── CHOOSE ─────────────────────────────────────────────── */}
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ModeCard icon="🔗" title="From a URL" desc="Paste a profile link and we'll pull the details"
                onClick={() => setMode('url')} />
              <ModeCard icon="📥" title="Import" desc="Upload a screenshot/file, or paste text"
                onClick={() => setMode('import')} />
              <ModeCard icon="✍️" title="Manual entry" desc="Fill in the details yourself"
                onClick={() => setMode('manual')} />
            </div>
          )}

          {/* ── URL ────────────────────────────────────────────────── */}
          {mode === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {urlStatus === 'done' ? (
                <DoneBanner label="that page" onRetry={() => setUrlStatus(null)} onContinue={() => setMode('manual')} />
              ) : (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Profile URL</label>
                    <input type="url" value={urlValue} onChange={e => setUrlValue(e.target.value)}
                      placeholder="https://..." disabled={urlStatus === 'analyzing'} style={FIELD_STYLE} />
                  </div>

                  {urlStatus === 'error' && <ErrorBanner>{urlError}</ErrorBanner>}

                  <button type="button" onClick={handleUrlExtract}
                    disabled={!urlValue.trim() || urlStatus === 'analyzing'}
                    style={PRIMARY_BTN_STYLE(urlValue.trim() && urlStatus !== 'analyzing')}>
                    {urlStatus === 'analyzing' ? (
                      <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Fetching…</>
                    ) : '✦ Extract Info'}
                  </button>

                  <p style={{ margin: 0, fontSize: 11, color: '#AAAAAA', lineHeight: 1.5 }}>
                    Works best for public pages. Sites that require login (most dating apps) usually can't be
                    fetched this way — use Import to paste the text instead.
                  </p>

                  <SkipManualLink onClick={() => setMode('manual')} />
                </>
              )}
            </div>
          )}

          {/* ── IMPORT ─────────────────────────────────────────────── */}
          {mode === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {importStatus === 'done' ? (
                <DoneBanner label={importName} onRetry={resetImport} onContinue={() => setMode('manual')} />
              ) : (
                <>
                  {importStatus === null && (
                    <div style={{ display: 'flex', gap: 2, background: '#F5F5F5', borderRadius: 20, padding: 2, alignSelf: 'flex-start' }}>
                      {[['file', '📎 Upload'], ['paste', '📋 Paste text']].map(([tab, label]) => (
                        <button key={tab} type="button" onClick={() => setImportTab(tab)}
                          style={{
                            padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                            background: importTab === tab ? '#FFFFFF' : 'transparent',
                            color: importTab === tab ? '#111111' : '#999999',
                            boxShadow: importTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    ref={importFileRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />

                  {importStatus === null && importTab === 'file' && (
                    <button type="button" onClick={() => importFileRef.current?.click()} style={{
                      width: '100%', padding: '22px 16px', borderRadius: 14,
                      background: '#FAFAFA', border: '2px dashed #E0E0E0',
                      color: '#666666', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 22 }}>📎</span>
                      Upload a screenshot, PDF, or dating profile
                    </button>
                  )}

                  {importStatus === null && importTab === 'paste' && (
                    <>
                      <textarea
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder="Paste their bio, dating profile, or a conversation…"
                        rows={6}
                        style={{ ...FIELD_STYLE, fontSize: 13, resize: 'none', lineHeight: 1.5 }}
                      />
                      <button type="button" onClick={handlePasteExtract} disabled={!pasteText.trim()}
                        style={PRIMARY_BTN_STYLE(!!pasteText.trim())}>
                        ✦ Extract Info
                      </button>
                    </>
                  )}

                  {importStatus === 'analyzing' && (
                    <div style={{
                      padding: '11px 14px', borderRadius: 12,
                      background: '#F5F5F5', border: '1px solid #E8E8E8',
                      color: '#888888', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                      Analyzing {importName}…
                    </div>
                  )}

                  {importStatus === 'error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: '#FEF5F5', border: '1px solid #F0CCCC',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                      }}>
                        <span style={{ fontSize: 13, color: '#C04040', lineHeight: 1.4 }}>{importError}</span>
                        <button type="button" onClick={resetImport} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#888888', fontSize: 11, padding: 0, flexShrink: 0,
                        }}>Try again</button>
                      </div>
                    </div>
                  )}

                  {importStatus === null && <SkipManualLink onClick={() => setMode('manual')} />}
                </>
              )}
            </div>
          )}

          {/* ── MANUAL — step 1 ────────────────────────────────────── */}
          {mode === 'manual' && step === 1 && (
            <>
              <div>
                <label style={LABEL_STYLE}>Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="First name" required autoFocus style={FIELD_STYLE} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_STYLE}>Age</label>
                  <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                    placeholder="28" min="18" max="99" style={FIELD_STYLE} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_STYLE}>Height</label>
                  <input type="text" value={form.height} onChange={e => set('height', e.target.value)}
                    placeholder={`5'6"`} style={FIELD_STYLE} />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Location</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="New York, NY" style={FIELD_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Occupation</label>
                <input type="text" value={form.occupation} onChange={e => set('occupation', e.target.value)}
                  placeholder="Product Manager at Stripe" style={FIELD_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Photo URL (optional)</label>
                <input type="url" value={form.photo} onChange={e => set('photo', e.target.value)}
                  placeholder="https://..." style={FIELD_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Met on</label>
                <PillSelect options={MET_ON_OPTIONS} value={form.metOn} onChange={v => set('metOn', v)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Looking for</label>
                <PillSelect options={LOOKING_FOR_OPTIONS} value={form.lookingFor} onChange={v => set('lookingFor', v)} />
              </div>

              <button type="button" onClick={() => setStep(2)} disabled={!form.name.trim()}
                style={PRIMARY_BTN_STYLE(!!form.name.trim())}>
                Continue →
              </button>
            </>
          )}

          {/* ── MANUAL — step 2 ────────────────────────────────────── */}
          {mode === 'manual' && step === 2 && (
            <>
              <div>
                <label style={LABEL_STYLE}>Interests</label>
                <PillSelect options={INTEREST_TAGS} value={form.interests} onChange={v => set('interests', v)} multi />
              </div>
              <div>
                <label style={LABEL_STYLE}>First impression</label>
                <textarea value={form.firstImpression} onChange={e => set('firstImpression', e.target.value)}
                  placeholder="What stood out immediately..." rows={3}
                  style={{ ...FIELD_STYLE, resize: 'none' }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Green flags <span style={{ color: '#AAAAAA', fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
                <input type="text" value={form.greenFlags} onChange={e => set('greenFlags', e.target.value)}
                  placeholder="Ambitious, Great sense of humor, Independent" style={FIELD_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Red flags <span style={{ color: '#AAAAAA', fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
                <input type="text" value={form.redFlags} onChange={e => set('redFlags', e.target.value)}
                  placeholder="Vague about commitment, Cancelled twice" style={FIELD_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Anything else worth remembering..." rows={3}
                  style={{ ...FIELD_STYLE, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: 'transparent', color: '#666666',
                  border: '1px solid #E8E8E8',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}>← Back</button>
                <button type="submit" style={{ ...PRIMARY_BTN_STYLE(true), flex: 2, width: 'auto' }}>
                  Add to Book
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

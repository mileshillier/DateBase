import { useState, useRef, useEffect } from 'react';
import { Avatar } from '../components/Avatar';
import { STATUS_CONFIG, formatDate, formatDaysAgo, getDaysSince } from '../data/profiles';

const HEADER_H = 80;
const STATUS_OPTIONS = ['prospect', 'active', 'exclusive', 'archived', 'ended'];

const TYPE_ICONS = {
  'First Date': '🥂', 'Second Date': '🍷', 'Date': '✨',
  'Coffee': '☕', 'Dinner': '🍽️', 'Call': '📞',
  'Text': '💬', 'Video Call': '📹', 'Event': '🎟️', 'Trip': '✈️', 'Other': '📝',
};

// ── Shared sub-components ─────────────────────────────────────────────────

function StarDisplay({ value }) {
  if (!value) return null;
  return (
    <span style={{ fontSize: 14, letterSpacing: 1, color: '#7A2848' }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function Tag({ children, color = '#7A2848' }) {
  return (
    <span style={{
      fontSize: 12, padding: '4px 10px', borderRadius: 20,
      background: `${color}10`, color, border: `1px solid ${color}22`,
      fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

// ── Photos grid — wrapping grid of tiles with click-to-upload placeholders ──

function PhotoGrid({ photos = [], onChange, tileSize = 110 }) {
  const fileRef = useRef(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file later
    if (!files.length) return;

    Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.readAsDataURL(file);
    }))).then(dataUrls => onChange([...(photos || []), ...dataUrls]));
  }

  function removePhoto(idx) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  // Always keep a handful of empty, clickable placeholders in the grid —
  // at least 6 while empty, and always at least 1 spare slot to add more.
  const emptySlots = Math.max(6 - photos.length, 1);

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
        gap: 10,
      }}>
        {photos.map((src, i) => (
          <div key={i} style={{
            position: 'relative', aspectRatio: '1', borderRadius: 14,
            overflow: 'hidden', border: '1px solid #E8E8E8', background: '#F5F5F5',
          }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={() => removePhoto(i)} style={{
              position: 'absolute', top: 6, right: 6,
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', color: '#FFFFFF',
              border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <button key={`empty-${i}`} type="button" onClick={() => fileRef.current?.click()} style={{
            aspectRatio: '1', borderRadius: 14,
            border: '1.5px dashed #DDDDDD', background: '#FAFAFA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#CCCCCC', fontSize: 26, fontWeight: 300, padding: 0,
          }}>
            +
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#BBBBBB',
      textTransform: 'uppercase', letterSpacing: '0.09em',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function InteractionEntry({ interaction, compact }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: compact ? 12 : 16 }}>
      <div style={{
        width: compact ? 34 : 38, height: compact ? 34 : 38,
        borderRadius: '50%', flexShrink: 0,
        background: '#F5F5F5', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: compact ? 14 : 16,
        border: '1px solid #EEEEEE',
      }}>
        {TYPE_ICONS[interaction.type] || '📝'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>{interaction.type}</span>
          <span style={{ fontSize: 11, color: '#BBBBBB', flexShrink: 0 }}>{formatDate(interaction.date)}</span>
        </div>
        {interaction.location && (
          <p style={{ margin: '0 0 3px', fontSize: 11, color: '#999999' }}>📍 {interaction.location}</p>
        )}
        <StarDisplay value={interaction.rating} />
        {interaction.note && (
          <p style={{ margin: '5px 0 0', fontSize: 13, color: '#555555', lineHeight: 1.55 }}>
            {interaction.note}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Flyout "Log Entry" button ─────────────────────────────────────────────

function LogEntryFlyout({ onLog, onImport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const btnStyle = {
    display: 'flex', alignItems: 'center', width: '100%',
    gap: 10, padding: '11px 16px', background: 'none',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    fontSize: 13, fontWeight: 600, color: '#111111',
    transition: 'background 0.1s',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7A2848 0%, #5C1D37 100%)',
          color: '#FFFFFF', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(122,40,72,0.28)',
        }}
      >
        ✦ Log Entry
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8 }}>
          <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E8E8',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)', zIndex: 100,
          overflow: 'hidden', minWidth: 196,
        }}>
          <button
            onMouseEnter={e => e.currentTarget.style.background = '#F6EBEF'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            style={btnStyle}
            onClick={() => { setOpen(false); onLog(); }}
          >
            <span style={{ fontSize: 16 }}>✦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>Add Interaction</div>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>Log a date, call, or meetup</div>
            </div>
          </button>
          <div style={{ height: 1, background: '#F5F5F5', margin: '0 12px' }} />
          <button
            onMouseEnter={e => e.currentTarget.style.background = '#F8F8FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            style={btnStyle}
            onClick={() => { setOpen(false); onImport(); }}
          >
            <span style={{ fontSize: 16 }}>📥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>Import Info</div>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>Paste text or add screenshot</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mobile layout ─────────────────────────────────────────────────────────

function MobileLayout({ profile, onLog, onImport, onUpdate }) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(profile.notes || '');
  const cfg = STATUS_CONFIG[profile.status] || STATUS_CONFIG.prospect;
  const days = getDaysSince(profile);
  const sortedInteractions = [...profile.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, paddingTop: HEADER_H, background: '#F9F7F5' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 0' }}>
        <div style={{ borderRadius: '50%', padding: 3, border: `2px solid ${cfg.dot}` }}>
          <Avatar profile={profile} size={88} />
        </div>
        <h1 style={{ margin: '14px 0 2px', fontSize: 26, fontWeight: 700, color: '#111111', textAlign: 'center' }}>
          {profile.name}
          {profile.age && <span style={{ fontSize: 18, fontWeight: 400, color: '#BBBBBB', marginLeft: 8 }}>{profile.age}</span>}
        </h1>
        {profile.occupation && <p style={{ margin: '0 0 6px', fontSize: 13, color: '#666666', textAlign: 'center' }}>{profile.occupation}</p>}
        {profile.location && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#BBBBBB' }}>📍 {profile.location}</p>}

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowStatusPicker(!showStatusPicker)} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: `${cfg.color}10`, color: cfg.color, border: `1px solid ${cfg.color}30`,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {cfg.label} ▾
          </button>
          {showStatusPicker && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6, background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E8E8', zIndex: 10, minWidth: 160, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              {STATUS_OPTIONS.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button key={s} onClick={() => { onUpdate(profile.id, { status: s }); setShowStatusPicker(false); }}
                    style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: profile.status === s ? `${c.color}10` : 'transparent', border: 'none', cursor: 'pointer', color: c.color, fontSize: 13, fontWeight: 600 }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0' }}>
        {[
          { label: 'Interactions', value: profile.interactions.length },
          { label: 'Last seen', value: days !== null ? formatDaysAgo(days) : '—' },
          { label: 'Met on', value: profile.metOn || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E8E8', padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{value}</div>
            <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E8E8', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Vibe</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => onUpdate(profile.id, { vibe: n === profile.vibe ? 0 : n })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: n <= profile.vibe ? '#7A2848' : '#EEEEEE', padding: 2 }}>
                {n <= profile.vibe ? '★' : '☆'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px 0' }}>
        <MobileSections profile={profile} onUpdate={onUpdate} editingNotes={editingNotes} setEditingNotes={setEditingNotes} notesValue={notesValue} setNotesValue={setNotesValue} />
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              History · {profile.interactions.length}
            </span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {sortedInteractions.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#DDDDDD', fontStyle: 'italic' }}>No interactions yet</p>
            ) : sortedInteractions.map((interaction, i) => (
              <div key={interaction.id}>
                {i > 0 && <div style={{ height: 1, background: '#F8F8F8', margin: '2px 0 14px' }} />}
                <InteractionEntry interaction={interaction} />
              </div>
            ))}
          </div>
        </div>
        <LogEntryFlyout onLog={onLog} onImport={onImport} />
      </div>
    </div>
  );
}

function MobileSections({ profile, onUpdate, editingNotes, setEditingNotes, notesValue, setNotesValue }) {
  return (
    <>
      <SimpleSection title="Photos">
        <PhotoGrid photos={profile.photos || []} onChange={photos => onUpdate(profile.id, { photos })} tileSize={90} />
      </SimpleSection>
      {(profile.height || profile.lookingFor) && (
        <SimpleSection title="Details">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.height && <Tag>{profile.height}</Tag>}
            {profile.lookingFor && <Tag color="#888888">{profile.lookingFor}</Tag>}
          </div>
        </SimpleSection>
      )}
      {profile.firstImpression && (
        <SimpleSection title="First Impression">
          <p style={{ margin: 0, fontSize: 13, color: '#444444', lineHeight: 1.6, fontStyle: 'italic' }}>"{profile.firstImpression}"</p>
        </SimpleSection>
      )}
      {profile.interests && profile.interests.length > 0 && (
        <SimpleSection title="Interests">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.interests.map(tag => <Tag key={tag} color="#888888">{tag}</Tag>)}
          </div>
        </SimpleSection>
      )}
      {((profile.greenFlags && profile.greenFlags.length > 0) || (profile.redFlags && profile.redFlags.length > 0)) && (
        <SimpleSection title="Flags">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(profile.greenFlags || []).map(f => <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span>🟢</span><span style={{ fontSize: 13, color: '#444444' }}>{f}</span></div>)}
            {(profile.redFlags || []).map(f => <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span>🔴</span><span style={{ fontSize: 13, color: '#444444' }}>{f}</span></div>)}
          </div>
        </SimpleSection>
      )}
      {profile.conversationHighlights && profile.conversationHighlights.length > 0 && (
        <SimpleSection title={`Extracted Facts · ${profile.conversationHighlights.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.conversationHighlights.map(h => (
              <div key={h.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 3, borderRadius: 3, background: 'rgba(122,40,72,0.25)', flexShrink: 0 }} />
                <div>
                  {h.label && <span style={{ fontSize: 10, fontWeight: 700, color: '#7A2848', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>{h.label}</span>}
                  <p style={{ margin: 0, fontSize: 13, color: '#444444', lineHeight: 1.5 }}>{h.text}</p>
                  <span style={{ fontSize: 10, color: '#CCCCCC' }}>{h.source} · {formatDate(h.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </SimpleSection>
      )}
      <SimpleSection title="Private Notes">
        {editingNotes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={4} autoFocus
              style={{ width: '100%', background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', color: '#111111', fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingNotes(false)} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'transparent', color: '#888888', border: '1px solid #E8E8E8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={() => { onUpdate(profile.id, { notes: notesValue }); setEditingNotes(false); }} style={{ flex: 2, padding: '8px', borderRadius: 10, background: 'rgba(122,40,72,0.08)', color: '#7A2848', border: '1px solid rgba(122,40,72,0.2)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setEditingNotes(true)} style={{ cursor: 'pointer', minHeight: 36 }}>
            <p style={{ margin: 0, fontSize: 13, color: profile.notes ? '#444444' : '#CCCCCC', lineHeight: 1.6, fontStyle: profile.notes ? 'normal' : 'italic' }}>
              {profile.notes || 'Tap to add private notes…'}
            </p>
          </div>
        )}
      </SimpleSection>
    </>
  );
}

function SimpleSection({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #F5F5F5' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

// ── Desktop layout — persona document ────────────────────────────────────

function DesktopLayout({ profile, onLog, onImport, onUpdate }) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(profile.notes || '');

  const cfg = STATUS_CONFIG[profile.status] || STATUS_CONFIG.prospect;
  const days = getDaysSince(profile);
  const sortedInteractions = [...profile.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const quickStats = [
    { label: 'Interactions', value: profile.interactions.length, icon: '📅' },
    { label: 'Last Seen', value: days !== null ? formatDaysAgo(days) : 'Never', icon: '🕐' },
    { label: 'Met On', value: profile.metOn || '—', icon: '📍' },
    ...(profile.lookingFor ? [{ label: 'Looking For', value: profile.lookingFor, icon: '💭' }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9F7F5', overflow: 'hidden' }}>

      {/* ── HERO HEADER ───────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
      }}>
        {/* Avatar with status ring */}
        <div style={{
          borderRadius: '50%', padding: 3,
          border: `2.5px solid ${cfg.dot}`, flexShrink: 0,
        }}>
          <Avatar profile={profile} size={80} />
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#111111', lineHeight: 1 }}>
              {profile.name}
            </h2>
            {profile.age && (
              <span style={{ fontSize: 18, fontWeight: 400, color: '#BBBBBB' }}>{profile.age}</span>
            )}
          </div>
          {profile.occupation && (
            <p style={{ margin: '0 0 4px', fontSize: 14, color: '#555555', fontWeight: 500 }}>
              {profile.occupation}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {profile.location && (
              <span style={{ fontSize: 12, color: '#AAAAAA' }}>📍 {profile.location}</span>
            )}
            {profile.metOn && (
              <span style={{ fontSize: 12, color: '#AAAAAA' }}>Met on {profile.metOn}</span>
            )}
          </div>
        </div>

        {/* Right: status + vibe */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          {/* Status picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowStatusPicker(!showStatusPicker)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: `${cfg.color}12`, color: cfg.color, border: `1.5px solid ${cfg.color}30`,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {cfg.label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showStatusPicker && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E8E8', zIndex: 30, minWidth: 160, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                {STATUS_OPTIONS.map(s => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button key={s}
                      onClick={() => { onUpdate(profile.id, { status: s }); setShowStatusPicker(false); }}
                      style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: profile.status === s ? `${c.color}10` : 'transparent', border: 'none', cursor: 'pointer', color: c.color, fontSize: 12, fontWeight: 600 }}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vibe stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#CCCCCC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vibe</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={() => onUpdate(profile.id, { vibe: n === profile.vibe ? 0 : n })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: n <= profile.vibe ? '#7A2848' : '#E8E8E8', padding: 1, lineHeight: 1 }}>
                  {n <= profile.vibe ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS STRIP ─────────────────────────────────── */}
      <div style={{
        display: 'flex', background: '#FAFAFA',
        borderBottom: '1px solid #EEEEEE', flexShrink: 0,
      }}>
        {quickStats.map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, padding: '14px 20px', textAlign: 'center',
            borderRight: i < quickStats.length - 1 ? '1px solid #EEEEEE' : 'none',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', lineHeight: 1, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── PHOTOS — full-width wrapping grid ─────────────────── */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #EEEEEE', flexShrink: 0 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E8E8', padding: '18px 20px' }}>
          <SectionLabel>Photos</SectionLabel>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <PhotoGrid photos={profile.photos || []} onChange={photos => onUpdate(profile.id, { photos })} />
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN CONTENT ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — persona info, each as its own card */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: '1px solid #EEEEEE',
          overflowY: 'auto',
          padding: '24px 24px 32px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>

          {/* First impression as a pull-quote */}
          {profile.firstImpression && (
            <SimpleSection title="First Impression">
              <div style={{ borderLeft: '3px solid #7A2848', paddingLeft: 14 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#333333', lineHeight: 1.65, fontStyle: 'italic' }}>
                  "{profile.firstImpression}"
                </p>
              </div>
            </SimpleSection>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <SimpleSection title="Interests">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.interests.map(tag => <Tag key={tag} color="#888888">{tag}</Tag>)}
              </div>
            </SimpleSection>
          )}

          {/* Green / red flags */}
          {((profile.greenFlags?.length > 0) || (profile.redFlags?.length > 0)) && (
            <SimpleSection title="Flags">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(profile.greenFlags || []).map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, lineHeight: '20px' }}>🟢</span>
                    <span style={{ fontSize: 13, color: '#333333', lineHeight: '20px' }}>{f}</span>
                  </div>
                ))}
                {(profile.redFlags || []).map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, lineHeight: '20px' }}>🔴</span>
                    <span style={{ fontSize: 13, color: '#333333', lineHeight: '20px' }}>{f}</span>
                  </div>
                ))}
              </div>
            </SimpleSection>
          )}

          {/* Details */}
          {(profile.height || profile.lookingFor) && (
            <SimpleSection title="Details">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.height && <Tag>{profile.height}</Tag>}
                {profile.lookingFor && <Tag color="#7A3AC8">{profile.lookingFor}</Tag>}
              </div>
            </SimpleSection>
          )}

          {/* Extracted facts */}
          {profile.conversationHighlights && profile.conversationHighlights.length > 0 && (
            <SimpleSection title={`Extracted Facts · ${profile.conversationHighlights.length}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.conversationHighlights.map(h => (
                  <div key={h.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 3, minHeight: 16, borderRadius: 3, background: 'rgba(122,40,72,0.22)', flexShrink: 0, marginTop: 3 }} />
                    <div>
                      {h.label && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#7A2848', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 2 }}>
                          {h.label}
                        </span>
                      )}
                      <p style={{ margin: 0, fontSize: 12, color: '#444444', lineHeight: 1.55 }}>{h.text}</p>
                      <span style={{ fontSize: 10, color: '#CCCCCC' }}>{h.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SimpleSection>
          )}

          {/* Private notes */}
          <SimpleSection title="Private Notes">
            {editingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={notesValue} onChange={e => setNotesValue(e.target.value)}
                  rows={5} autoFocus
                  style={{ width: '100%', background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', color: '#111111', fontSize: 12, outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingNotes(false)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'transparent', color: '#888888', border: '1px solid #E8E8E8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  <button onClick={() => { onUpdate(profile.id, { notes: notesValue }); setEditingNotes(false); }} style={{ flex: 2, padding: '7px', borderRadius: 8, background: 'rgba(122,40,72,0.08)', color: '#7A2848', border: '1px solid rgba(122,40,72,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingNotes(true)} style={{ cursor: 'pointer', minHeight: 32 }}>
                <p style={{ margin: 0, fontSize: 12, color: profile.notes ? '#444444' : '#CCCCCC', lineHeight: 1.6, fontStyle: profile.notes ? 'normal' : 'italic' }}>
                  {profile.notes || 'Click to add private notes…'}
                </p>
              </div>
            )}
          </SimpleSection>
        </div>

        {/* RIGHT — interaction history */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', minWidth: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111111' }}>History</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#AAAAAA' }}>
                {profile.interactions.length} {profile.interactions.length === 1 ? 'interaction' : 'interactions'} logged
              </p>
            </div>
            <LogEntryFlyout onLog={onLog} onImport={onImport} />
          </div>

          {sortedInteractions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 12 }}>📅</div>
              <p style={{ margin: 0, fontSize: 14, color: '#CCCCCC', fontStyle: 'italic' }}>No interactions yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#DDDDDD' }}>Use "Log Entry" above to add your first one</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedInteractions.map(interaction => (
                <div key={interaction.id} style={{
                  background: '#FFFFFF', borderRadius: 14, border: '1px solid #EEEEEE',
                  padding: '16px 18px',
                }}>
                  <InteractionEntry interaction={interaction} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

export function ProfileScreen({ profile, onLog, onImport, onUpdate, isDesktop }) {
  if (isDesktop) {
    return <DesktopLayout profile={profile} onLog={onLog} onImport={onImport} onUpdate={onUpdate} />;
  }
  return <MobileLayout profile={profile} onLog={onLog} onImport={onImport} onUpdate={onUpdate} />;
}

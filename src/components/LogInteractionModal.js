import { useState } from 'react';
import { nextId, INTERACTION_TYPES } from '../data/profiles';
import { Avatar } from './Avatar';

const FIELD_STYLE = {
  width: '100%', background: '#F5F5F5', border: '1px solid #E8E8E8',
  borderRadius: 12, padding: '12px 14px', color: '#111111', fontSize: 14,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, color: '#888888',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block',
};

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, padding: 2, color: n <= value ? '#C8415A' : '#CCCCCC' }}>
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export function LogInteractionModal({ profiles, preselectedProfileId, onSubmit, onClose }) {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const [profileId, setProfileId] = useState(preselectedProfileId || '');
  const [type, setType] = useState('Date');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const selectedProfile = profiles.find(p => p.id === profileId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!profileId) return;
    onSubmit(profileId, {
      id: nextId(),
      date, type, location: location.trim(), rating, note: note.trim(),
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#FFFFFF', borderRadius: 20,
        border: '1px solid #E8E8E8',
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111111' }}>
              Add Interaction
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#AAAAAA' }}>Log a date, call, meetup, or anything in between</p>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: '#F5F5F5', border: '1px solid #E8E8E8',
            color: '#666666', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Who */}
          <div>
            <label style={LABEL_STYLE}>Who</label>
            {selectedProfile && preselectedProfileId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F5F5F5', borderRadius: 12, border: '1px solid #E8E8E8' }}>
                <Avatar profile={selectedProfile} size={36} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{selectedProfile.name}</span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select value={profileId} onChange={e => setProfileId(e.target.value)} required
                  style={{ ...FIELD_STYLE, appearance: 'none', paddingRight: 36 }}>
                  <option value="">Select a person…</option>
                  {sorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none' }}>▾</span>
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label style={LABEL_STYLE}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {INTERACTION_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: type === t ? '1.5px solid #C8415A' : '1.5px solid #E8E8E8',
                    background: type === t ? 'rgba(200,65,90,0.08)' : 'transparent',
                    color: type === t ? '#C8415A' : '#666666', cursor: 'pointer',
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Date + Location — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={LABEL_STYLE}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={FIELD_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Venue, restaurant…" style={FIELD_STYLE} />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label style={LABEL_STYLE}>Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Note */}
          <div>
            <label style={LABEL_STYLE}>Notes <span style={{ color: '#AAAAAA', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="What happened, how it felt, what stood out…" rows={4}
              style={{ ...FIELD_STYLE, resize: 'none', lineHeight: 1.6 }} />
          </div>

          <button type="submit" disabled={!profileId}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: profileId ? 'linear-gradient(135deg, #C8415A 0%, #A8314A 100%)' : '#F5F5F5',
              color: profileId ? '#FFFFFF' : '#AAAAAA',
              border: 'none', cursor: profileId ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
              boxShadow: profileId ? '0 4px 16px rgba(200,65,90,0.3)' : 'none',
            }}>
            Save Interaction
          </button>
        </form>
      </div>
    </div>
  );
}

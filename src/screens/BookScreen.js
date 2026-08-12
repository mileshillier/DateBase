import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { STATUS_CONFIG, getDaysSince, formatDaysAgo } from '../data/profiles';
import { useBreakpoint } from '../hooks/useBreakpoint';

const HEADER_H = 80;
const STATUS_ORDER = ['active', 'exclusive', 'prospect', 'archived', 'ended'];

function VibeBar({ vibe }) {
  if (!vibe) return null;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <div key={n} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: n <= vibe ? '#7A2848' : '#E8E8E8',
        }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.prospect;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      background: `${cfg.color}14`, color: cfg.color,
      border: `1px solid ${cfg.color}30`, letterSpacing: '0.04em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function ProfileRow({ profile, onOpen, isActive }) {
  const days = getDaysSince(profile);
  const cfg = STATUS_CONFIG[profile.status] || STATUS_CONFIG.prospect;

  return (
    <button onClick={() => onOpen(profile.id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: isActive ? '#F6EBEF' : 'none',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        borderLeft: isActive ? '3px solid #7A2848' : '3px solid transparent',
        transition: 'background 0.12s',
      }}>
      <div style={{
        borderRadius: '50%', padding: 2, flexShrink: 0,
        border: `2px solid ${cfg.dot}`,
      }}>
        <Avatar profile={profile} size={44} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111111', fontFamily: "'DM Sans', sans-serif" }}>
            {profile.name}
          </span>
          {profile.age && <span style={{ fontSize: 11, color: '#CCCCCC' }}>{profile.age}</span>}
        </div>
        <div style={{ fontSize: 12, color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {profile.occupation || profile.location || '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VibeBar vibe={profile.vibe} />
          {days !== null && <span style={{ fontSize: 11, color: '#CCCCCC' }}>{formatDaysAgo(days)}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <StatusBadge status={profile.status} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="#DDDDDD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ── Mini stat chip shown in the desktop header ────────────────────────────
function HeaderStat({ value, label, color = '#111111' }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 16px', borderRight: '1px solid #F0EEEC' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#AAAAAA', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export function BookScreen({ profiles, onOpenProfile, selectedProfileId, isDesktop }) {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { isMobile } = useBreakpoint();

  const q = query.toLowerCase();
  const filtered = profiles
    .filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.occupation || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.metOn || '').toLowerCase().includes(q) ||
        p.interactions.some(i => (i.note || '').toLowerCase().includes(q));
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      return (getDaysSince(a) ?? 9999) - (getDaysSince(b) ?? 9999);
    });

  const counts = {};
  profiles.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });

  const activeCount = profiles.filter(p => ['active', 'exclusive'].includes(p.status)).length;
  const withVibe = profiles.filter(p => p.vibe > 0);
  const avgVibe = withVibe.length
    ? (withVibe.reduce((s, p) => s + p.vibe, 0) / withVibe.length).toFixed(1)
    : '—';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: isDesktop ? '100%' : undefined,
      minHeight: isDesktop ? '100vh' : undefined,
      paddingBottom: isDesktop ? 0 : 96,
      paddingTop: isDesktop ? 0 : HEADER_H,
      background: '#F9F7F5',
    }}>

      {/* Desktop header strip with stats */}
      {isDesktop && (
        <div style={{
          background: '#FFFFFF', borderBottom: '1px solid #E8E8E8',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111111', fontFamily: "'DM Sans', sans-serif" }}>
              Your Book
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#AAAAAA' }}>
              {profiles.length} {profiles.length === 1 ? 'person' : 'people'}
            </p>
          </div>
          <HeaderStat value={activeCount} label="Active" color="#7A2848" />
          <HeaderStat value={avgVibe} label="Avg Vibe" color="#7A3AC8" />
          <div style={{ padding: '0 0 0 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2A8A5A', fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
              {profiles.flatMap(p => p.interactions).length}
            </div>
            <div style={{ fontSize: 10, color: '#AAAAAA', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entries</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '12px 16px 8px', background: isDesktop ? '#FAFAFA' : undefined }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}
            width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#111111" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="Search name, notes, location…"
            value={query} onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
              background: '#FFFFFF', border: '1px solid #E8E8E8',
              color: '#111111', fontSize: 13, outline: 'none',
            }} />
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', overflowX: 'auto' }}>
        {[
          { value: 'all', label: `All · ${profiles.length}` },
          ...STATUS_ORDER.filter(s => counts[s]).map(s => ({
            value: s, label: `${STATUS_CONFIG[s].label} · ${counts[s]}`,
          })),
        ].map(opt => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', letterSpacing: '0.03em',
              border: filterStatus === opt.value ? '1.5px solid #7A2848' : '1.5px solid #E8E8E8',
              background: filterStatus === opt.value ? 'rgba(122,40,72,0.08)' : '#FFFFFF',
              color: filterStatus === opt.value ? '#7A2848' : '#888888',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Profile list — scrollable on desktop */}
      <div style={{
        flex: isDesktop ? 1 : undefined,
        overflowY: isDesktop ? 'auto' : undefined,
      }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📖</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111111', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>
              {profiles.length === 0 ? 'Your book is empty' : 'No matches'}
            </p>
            <p style={{ fontSize: 13, color: '#AAAAAA', margin: 0 }}>
              {profiles.length === 0 ? 'Tap + to add your first person' : 'Try a different search'}
            </p>
          </div>
        ) : (
          <div style={{
            margin: isDesktop ? '0 12px' : '0 12px',
            background: '#FFFFFF', borderRadius: 16,
            border: '1px solid #E8E8E8', overflow: 'hidden',
            marginBottom: isDesktop ? 12 : 0,
          }}>
            {filtered.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <div style={{ height: 1, background: '#F8F8F8', marginLeft: 68 }} />}
                <ProfileRow profile={p} onOpen={onOpenProfile} isActive={p.id === selectedProfileId} />
              </div>
            ))}
          </div>
        )}

        {!isMobile && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#DDDDDD', padding: '10px 0 4px' }}>
            {profiles.length} {profiles.length === 1 ? 'person' : 'people'} in your book
          </p>
        )}
      </div>
    </div>
  );
}

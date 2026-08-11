export const HEADER_H = 80;

function DBMark() {
  return (
    <div style={{
      width: 34, height: 34,
      borderRadius: 10,
      background: 'linear-gradient(145deg, #C8415A 0%, #A8314A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 10px rgba(200,65,90,0.32)',
    }}>
      <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
        <path d="M4 3h7a5 5 0 010 10H4V3z" fill="white" fillOpacity="0.95" />
        <path d="M4 3v14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14.5" cy="14.5" r="3.5" fill="white" fillOpacity="0.9" />
        <path d="M13 14.5h3M14.5 13v3" stroke="rgba(200,65,90,0.9)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AppHeader({ selectedProfile, onBack }) {
  const isDetail = !!selectedProfile;

  return (
    <header style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 390, zIndex: 200,
      background: '#FFFFFF',
      borderBottom: '1px solid #E8E8E8',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Status bar spacer */}
      <div style={{ height: 44 }} />

      {/* Content row */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px 8px',
      }}>
        {isDetail ? (
          <>
            <button onClick={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#C8415A', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '4px 0',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="#C8415A" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Book
            </button>

            <span style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              fontSize: 14, fontWeight: 600, color: '#111111',
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selectedProfile.name}
            </span>

            <div style={{ width: 40 }} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <DBMark />
              <span style={{
                fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em',
                fontFamily: "'DM Sans', sans-serif",
                color: '#111111',
              }}>
                DateBase
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#888888', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </>
        )}
      </div>
    </header>
  );
}

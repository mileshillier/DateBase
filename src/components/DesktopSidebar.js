// Sidebar navigation for tablet and desktop layouts

function DBMark() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 11,
      background: 'linear-gradient(145deg, #7A2848 0%, #5C1D37 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 10px rgba(122,40,72,0.28)',
    }}>
      <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
        <path d="M4 3h7a5 5 0 010 10H4V3z" fill="white" fillOpacity="0.95" />
        <path d="M4 3v14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14.5" cy="14.5" r="3.5" fill="white" fillOpacity="0.9" />
        <path d="M13 14.5h3M14.5 13v3" stroke="rgba(122,40,72,0.9)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
      background: active ? 'rgba(122,40,72,0.08)' : 'transparent',
      color: active ? '#7A2848' : '#666666',
      fontSize: 14, fontWeight: active ? 600 : 400,
      transition: 'background 0.15s, color 0.15s',
      textAlign: 'left',
    }}>
      <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke="currentColor" strokeWidth="1.75" fill="none" />
    </svg>
  );
}

function InsightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function DesktopSidebar({ activeTab, onTabChange, onAddPress, compact = false }) {
  // compact = true → icon-only (narrow sidebar for tablet)
  return (
    <aside style={{
      width: compact ? 72 : 220,
      minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E8E8E8',
      display: 'flex',
      flexDirection: 'column',
      padding: compact ? '24px 0' : '24px 12px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: compact ? '0 0 24px' : '0 4px 24px',
        justifyContent: compact ? 'center' : 'flex-start',
        borderBottom: '1px solid #F5F5F5',
        marginBottom: 8,
      }}>
        <DBMark />
        {!compact && (
          <span style={{
            fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em',
            fontFamily: "'DM Sans', sans-serif", color: '#111111',
          }}>
            DateBase
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {compact ? (
          <>
            <CompactNavBtn active={activeTab === 'book'} onClick={() => onTabChange('book')}
              icon={<BookIcon />} label="Book" />
            <CompactNavBtn active={false} onClick={onAddPress}
              icon={<PlusIcon />} label="New" accent />
            <CompactNavBtn active={activeTab === 'insights'} onClick={() => onTabChange('insights')}
              icon={<InsightIcon />} label="Insights" />
          </>
        ) : (
          <>
            <NavItem icon={<BookIcon />} label="Book" active={activeTab === 'book'} onClick={() => onTabChange('book')} />
            <NavItem icon={<InsightIcon />} label="Insights" active={activeTab === 'insights'} onClick={() => onTabChange('insights')} />
          </>
        )}
      </nav>

      {/* Add new profile button */}
      {!compact && (
        <button onClick={onAddPress} style={{
          width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7A2848 0%, #5C1D37 100%)',
          color: '#FFFFFF', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(122,40,72,0.3)',
          marginTop: 'auto',
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          New Profile
        </button>
      )}

      {/* Date footer */}
      {!compact && (
        <p style={{ margin: '16px 4px 0', fontSize: 11, color: '#CCCCCC', lineHeight: 1 }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </aside>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CompactNavBtn({ active, onClick, icon, label, accent }) {
  return (
    <button onClick={onClick} title={label} style={{
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '10px 0', border: 'none', cursor: 'pointer', borderRadius: 10,
      background: active ? 'rgba(122,40,72,0.08)' : accent ? 'rgba(122,40,72,0.06)' : 'transparent',
      color: active || accent ? '#7A2848' : '#AAAAAA',
      fontSize: 10, fontWeight: active ? 600 : 400,
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

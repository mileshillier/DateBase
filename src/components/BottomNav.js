function BookIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={active ? '#C8415A' : '#AAAAAA'} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={active ? '#C8415A' : '#AAAAAA'} strokeWidth="1.75"
        fill={active ? 'rgba(200,65,90,0.1)' : 'none'} />
    </svg>
  );
}

function InsightIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1"
        fill={active ? '#C8415A' : 'none'}
        stroke={active ? '#C8415A' : '#AAAAAA'} strokeWidth="1.75" />
      <rect x="10" y="7" width="4" height="14" rx="1"
        fill={active ? 'rgba(200,65,90,0.3)' : 'none'}
        stroke={active ? '#C8415A' : '#AAAAAA'} strokeWidth="1.75" />
      <rect x="17" y="3" width="4" height="18" rx="1"
        fill={active ? 'rgba(200,65,90,0.15)' : 'none'}
        stroke={active ? '#C8415A' : '#AAAAAA'} strokeWidth="1.75" />
    </svg>
  );
}

export function BottomNav({ activeTab, onTabChange, onAddPress }) {
  const label = (tab) => ({
    fontSize: 11, fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#C8415A' : '#AAAAAA',
    letterSpacing: '0.01em', marginTop: 1,
  });

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 390,
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E8E8E8',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 64, padding: '0 8px' }}>

        {/* Book */}
        <button onClick={() => onTabChange('book')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>
          <BookIcon active={activeTab === 'book'} />
          <span style={label('book')}>Book</span>
        </button>

        {/* Add FAB */}
        <button onClick={onAddPress}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #C8415A 0%, #A8314A 100%)',
            boxShadow: '0 4px 20px rgba(200,65,90,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: -16, flexShrink: 0,
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Insights */}
        <button onClick={() => onTabChange('insights')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>
          <InsightIcon active={activeTab === 'insights'} />
          <span style={label('insights')}>Insights</span>
        </button>

      </div>
    </nav>
  );
}

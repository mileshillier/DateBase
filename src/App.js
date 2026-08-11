import { useState, useEffect } from 'react';
import { loadProfiles, saveProfiles } from './data/profiles';
import { useBreakpoint } from './hooks/useBreakpoint';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { AddProfileModal } from './components/AddProfileModal';
import { LogInteractionModal } from './components/LogInteractionModal';
import { ConversationImportModal } from './components/ConversationImportModal';
import { BookScreen } from './screens/BookScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { InsightsScreen } from './screens/InsightsScreen';

// ── Empty-state panel shown on desktop when no profile is selected ─────────

function EmptyDetailPanel() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#FAFAFA', gap: 12,
      borderLeft: '1px solid #E8E8E8',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(145deg, #C8415A 0%, #A8314A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(200,65,90,0.22)', opacity: 0.85,
      }}>
        <svg width={28} height={28} viewBox="0 0 20 20" fill="none">
          <path d="M4 3h7a5 5 0 010 10H4V3z" fill="white" fillOpacity="0.95" />
          <path d="M4 3v14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14.5" cy="14.5" r="3.5" fill="white" fillOpacity="0.9" />
          <path d="M13 14.5h3M14.5 13v3" stroke="rgba(200,65,90,0.9)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#CCCCCC', fontFamily: "'DM Sans', sans-serif" }}>
        Select a profile
      </p>
      <p style={{ margin: 0, fontSize: 13, color: '#DDDDDD' }}>
        Choose someone from your book to view details
      </p>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [activeTab, setActiveTab] = useState('book');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [logModalProfileId, setLogModalProfileId] = useState(null);
  const [importModalProfileId, setImportModalProfileId] = useState(null);

  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const isWide = isTablet || isDesktop; // sidebar is visible

  useEffect(() => { saveProfiles(profiles); }, [profiles]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;

  function openProfile(id) {
    setSelectedProfileId(id);
    // On mobile, navigating to a profile means we're "in" it — keep activeTab for back navigation
  }

  function closeProfile() {
    setSelectedProfileId(null);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (isMobile) setSelectedProfileId(null);
  }

  function addProfile(newProfile) {
    setProfiles(prev => [newProfile, ...prev]);
    setSelectedProfileId(newProfile.id);
    setActiveTab('book');
  }

  function logInteraction(profileId, interaction) {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, interactions: [interaction, ...p.interactions], updatedAt: new Date().toISOString().split('T')[0] }
        : p
    ));
  }

  function updateProfile(profileId, changes) {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, ...changes, updatedAt: new Date().toISOString().split('T')[0] }
        : p
    ));
  }

  function importConversation(profileId, highlights, newInterests) {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      const existingTexts = new Set((p.conversationHighlights || []).map(h => h.text));
      const freshHighlights = highlights.filter(h => !existingTexts.has(h.text));
      const mergedInterests = [...new Set([...(p.interests || []), ...newInterests])];
      return {
        ...p,
        conversationHighlights: [...(p.conversationHighlights || []), ...freshHighlights],
        interests: mergedInterests,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }));
  }

  function openLog(profileId) { setLogModalProfileId(profileId || null); setShowLogModal(true); }
  function openImport(profileId) { setImportModalProfileId(profileId || null); setShowImportModal(true); }

  // ── Shared modals (same for all breakpoints) ───────────────────────────
  const modals = (
    <>
      {showAddProfile && (
        <AddProfileModal onAdd={addProfile} onClose={() => setShowAddProfile(false)} />
      )}
      {showLogModal && (
        <LogInteractionModal
          profiles={profiles}
          preselectedProfileId={logModalProfileId}
          onSubmit={logInteraction}
          onClose={() => { setShowLogModal(false); setLogModalProfileId(null); }}
        />
      )}
      {showImportModal && (
        <ConversationImportModal
          profiles={profiles}
          preselectedProfileId={importModalProfileId}
          onImport={importConversation}
          onClose={() => { setShowImportModal(false); setImportModalProfileId(null); }}
        />
      )}
    </>
  );

  // ── MOBILE layout ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7F5' }}>
        <AppHeader selectedProfile={selectedProfile} onBack={closeProfile} />

        {selectedProfile ? (
          <ProfileScreen
            profile={selectedProfile}
            onLog={() => openLog(selectedProfile.id)}
            onImport={() => openImport(selectedProfile.id)}
            onUpdate={updateProfile}
          />
        ) : activeTab === 'book' ? (
          <BookScreen
            profiles={profiles}
            onOpenProfile={openProfile}
            selectedProfileId={selectedProfileId}
          />
        ) : (
          <InsightsScreen profiles={profiles} />
        )}

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onAddPress={() => setShowAddProfile(true)} />
        {modals}
      </div>
    );
  }

  // ── TABLET layout (sidebar + single content pane) ─────────────────────
  if (isTablet) {
    const showProfile = !!selectedProfile;

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F0EEEC' }}>
        <DesktopSidebar
          activeTab={showProfile ? 'book' : activeTab}
          onTabChange={tab => { handleTabChange(tab); setSelectedProfileId(null); }}
          onAddPress={() => setShowAddProfile(true)}
          compact
        />

        <div style={{ flex: 1, overflowY: 'auto', background: '#F9F7F5' }}>
          {showProfile ? (
            <>
              {/* Slim back bar */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #E8E8E8', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 50,
              }}>
                <button onClick={closeProfile} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: '#C8415A', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="#C8415A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Book
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111111', marginLeft: 8 }}>
                  {selectedProfile.name}
                </span>
              </div>
              <ProfileScreen
                profile={selectedProfile}
                onLog={() => openLog(selectedProfile.id)}
                onImport={() => openImport(selectedProfile.id)}
                onUpdate={updateProfile}
                isDesktop
              />
            </>
          ) : activeTab === 'book' ? (
            <BookScreen
              profiles={profiles}
              onOpenProfile={openProfile}
              selectedProfileId={selectedProfileId}
              isDesktop
            />
          ) : (
            <InsightsScreen profiles={profiles} isDesktop />
          )}
        </div>

        {modals}
      </div>
    );
  }

  // ── DESKTOP layout (sidebar + list pane + detail pane) ────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: '100vh', background: '#F0EEEC', overflow: 'hidden' }}>

      {/* Left sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); if (tab !== 'book') setSelectedProfileId(null); }}
        onAddPress={() => setShowAddProfile(true)}
      />

      {activeTab === 'insights' ? (
        /* Insights gets the full remaining width */
        <div style={{ flex: 1, overflowY: 'auto', background: '#F9F7F5' }}>
          <InsightsScreen profiles={profiles} isDesktop />
        </div>
      ) : (
        /* Book: list pane + detail pane */
        <>
          <div style={{
            width: 360, flexShrink: 0,
            borderRight: '1px solid #E8E8E8',
            overflowY: 'auto', background: '#F9F7F5',
            display: 'flex', flexDirection: 'column',
          }}>
            <BookScreen
              profiles={profiles}
              onOpenProfile={openProfile}
              selectedProfileId={selectedProfileId}
              isDesktop
            />
          </div>

          <div style={{ flex: 1, overflow: 'hidden', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
            {selectedProfile ? (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <ProfileScreen
                  profile={selectedProfile}
                  onLog={() => openLog(selectedProfile.id)}
                  onImport={() => openImport(selectedProfile.id)}
                  onUpdate={updateProfile}
                  isDesktop
                />
              </div>
            ) : (
              <EmptyDetailPanel />
            )}
          </div>
        </>
      )}

      {modals}
    </div>
  );
}

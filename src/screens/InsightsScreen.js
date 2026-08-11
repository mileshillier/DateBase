import { STATUS_CONFIG } from '../data/profiles';
import { useBreakpoint } from '../hooks/useBreakpoint';

// ── Sub-components ────────────────────────────────────────────────────────

function KpiTile({ value, label, sub, color = '#C8415A', icon }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E8E8',
      padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#888888', marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#CCCCCC', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 18, border: '1px solid #E8E8E8',
      overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style,
    }}>
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #F5F5F5', paddingBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 20px', flex: 1 }}>{children}</div>
    </div>
  );
}

function HBar({ label, value, max, color = '#C8415A', rank }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {rank !== undefined && (
        <span style={{ fontSize: 11, color: '#CCCCCC', width: 14, textAlign: 'right', flexShrink: 0 }}>
          {rank}
        </span>
      )}
      <span style={{ fontSize: 13, color: '#444444', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 7, background: '#F5F5F5', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#111111', width: 28, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

function Donut({ segments, total, size = 130 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.37, sw = size * 0.1;
  const C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0F0" strokeWidth={sw} />
      {segments.map((seg, i) => {
        if (!seg.value) return null;
        const arcLen = (seg.value / total) * C;
        const offset = C - cum;
        cum += arcLen;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${arcLen} ${C - arcLen}`}
            strokeDashoffset={offset}
            transform={`rotate(-90, ${cx}, ${cy})`} />
        );
      })}
      <text x={cx} y={cy - 9} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.18} fontWeight={700} fill="#111111" fontFamily="DM Sans, sans-serif">
        {total}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.075} fill="#AAAAAA" fontFamily="DM Sans, sans-serif">
        profiles
      </text>
    </svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

const HEADER_H = 80;

export function InsightsScreen({ profiles, isDesktop }) {
  const { width } = useBreakpoint();
  const allInteractions = profiles.flatMap(p => p.interactions);

  // --- Derived stats ---
  const statusCounts = profiles.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const activeCount = profiles.filter(p => ['active', 'exclusive'].includes(p.status)).length;

  const withVibe = profiles.filter(p => p.vibe > 0);
  const avgVibe = withVibe.length
    ? (withVibe.reduce((s, p) => s + p.vibe, 0) / withVibe.length).toFixed(1)
    : '—';

  const typeCounts = allInteractions.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(...typeEntries.map(([, v]) => v), 1);

  const topProfiles = [...profiles]
    .sort((a, b) => b.interactions.length - a.interactions.length)
    .slice(0, 6);
  const maxInteractions = Math.max(...topProfiles.map(p => p.interactions.length), 1);

  const metOnCounts = profiles.reduce((acc, p) => {
    if (p.metOn) acc[p.metOn] = (acc[p.metOn] || 0) + 1;
    return acc;
  }, {});
  const metOnEntries = Object.entries(metOnCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxMetOn = Math.max(...metOnEntries.map(([, v]) => v), 1);

  // Avg interactions per active profile
  const activePeople = profiles.filter(p => p.status === 'active');
  const avgDates = activePeople.length
    ? (activePeople.reduce((s, p) => s + p.interactions.length, 0) / activePeople.length).toFixed(1)
    : '—';

  const pad = isDesktop ? '0 24px' : '0 16px';
  const gap = isDesktop ? 12 : 10;

  // Grid cols for the 2-col card sections
  const gridCols = width >= 900 ? '1fr 1fr' : '1fr';

  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: isDesktop ? 40 : 96,
      paddingTop: isDesktop ? 0 : HEADER_H,
      background: '#F9F7F5',
    }}>

      {/* Page header */}
      <div style={{
        padding: isDesktop ? '28px 24px 20px' : '20px 16px 12px',
        borderBottom: '1px solid #F0EEEC',
        background: isDesktop ? '#FFFFFF' : undefined,
      }}>
        <h1 style={{
          margin: 0, fontSize: isDesktop ? 24 : 18,
          fontWeight: 700, color: '#111111',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Insights
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888888' }}>
          {allInteractions.length} logged {allInteractions.length === 1 ? 'interaction' : 'interactions'} across {profiles.length} {profiles.length === 1 ? 'person' : 'people'}
        </p>
      </div>

      <div style={{ padding: isDesktop ? '20px 24px' : '16px', display: 'flex', flexDirection: 'column', gap }}>

        {/* KPI tiles — always a flex row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop
            ? 'repeat(4, 1fr)'
            : 'repeat(2, 1fr)',
          gap,
        }}>
          <KpiTile value={activeCount} label="Currently active" sub="dating" color="#C8415A" icon="🔥" />
          <KpiTile value={avgVibe} label="Average vibe" sub="across profiles" color="#7A3AC8" icon="⭐" />
          <KpiTile value={allInteractions.length} label="Total entries" sub="logged" color="#2A8A5A" icon="📋" />
          <KpiTile value={avgDates} label="Dates per active" sub="avg interactions" color="#B86B22" icon="📅" />
        </div>

        {/* Row 2: Status breakdown + Entry types */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap }}>

          {/* Status donut */}
          <Card title="Status Breakdown">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Donut
                total={profiles.length}
                size={isDesktop ? 150 : 120}
                segments={[
                  { value: statusCounts.active || 0, color: '#C8415A' },
                  { value: statusCounts.exclusive || 0, color: '#10B981' },
                  { value: statusCounts.prospect || 0, color: '#AAAAAA' },
                  { value: statusCounts.archived || 0, color: '#D4D4D4' },
                  { value: statusCounts.ended || 0, color: '#E8E8E8' },
                ]}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {Object.entries(STATUS_CONFIG).filter(([s]) => statusCounts[s]).map(([status, cfg]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#555555', flex: 1 }}>{cfg.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111111', fontFamily: "'DM Sans', sans-serif" }}>
                      {statusCounts[status] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Entry types */}
          {typeEntries.length > 0 && (
            <Card title="By Entry Type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typeEntries.map(([type, count], i) => (
                  <HBar key={type} label={type} value={count} max={maxType} rank={i + 1} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Row 3: Most logged + Where you met */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap }}>

          {topProfiles.filter(p => p.interactions.length > 0).length > 0 && (
            <Card title="Most Logged">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topProfiles.filter(p => p.interactions.length > 0).map((p, i) => (
                  <HBar key={p.id} label={p.name.split(' ')[0]} value={p.interactions.length} max={maxInteractions} rank={i + 1} />
                ))}
              </div>
            </Card>
          )}

          {metOnEntries.length > 0 && (
            <Card title="Where You Met">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {metOnEntries.map(([source, count], i) => (
                  <HBar key={source} label={source} value={count} max={maxMetOn} color="#7A3AC8" rank={i + 1} />
                ))}
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

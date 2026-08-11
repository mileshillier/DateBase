import { AVATAR_COLORS, initials } from '../data/profiles';

export function Avatar({ profile, size = 44 }) {
  if (profile.photo) {
    return (
      <img
        src={profile.photo}
        alt={profile.name}
        width={size}
        height={size}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block', flexShrink: 0,
        }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }

  const colors = AVATAR_COLORS[profile.avatarColor % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors.bg, color: colors.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.33), fontWeight: 600,
      letterSpacing: '-0.02em', flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
      border: `1px solid ${colors.text}22`,
    }}>
      {initials(profile.name)}
    </div>
  );
}

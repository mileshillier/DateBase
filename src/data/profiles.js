// ── Constants ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  prospect:  { label: 'Prospect',  color: '#888888', dot: '#AAAAAA' },
  active:    { label: 'Active',    color: '#7A2848', dot: '#7A2848' },
  exclusive: { label: 'Exclusive', color: '#10B981', dot: '#10B981' },
  archived:  { label: 'Archived',  color: '#AAAAAA', dot: '#CCCCCC' },
  ended:     { label: 'Ended',     color: '#888888', dot: '#AAAAAA' },
};

export const MET_ON_OPTIONS = [
  'Hinge', 'Bumble', 'Tinder', 'The League', 'Coffee Meets Bagel',
  'In person', 'Through friends', 'Work', 'Event', 'Other',
];

export const LOOKING_FOR_OPTIONS = [
  'Something serious', 'Dating casually', 'Figuring it out',
  'Not sure yet', 'Long-term relationship',
];

export const INTERACTION_TYPES = [
  'First Date', 'Second Date', 'Date', 'Coffee', 'Dinner',
  'Call', 'Text', 'Video Call', 'Event', 'Trip', 'Other',
];

export const INTEREST_TAGS = [
  'Travel', 'Wine', 'Hiking', 'Fitness', 'Cooking', 'Art', 'Music',
  'Film', 'Reading', 'Yoga', 'Tennis', 'Golf', 'Skiing', 'Surfing',
  'Photography', 'Architecture', 'Food', 'Fashion', 'Theatre', 'Dogs',
  'Cats', 'Startup culture', 'Politics', 'Spirituality', 'Interior design',
];

// ── ID generator ──────────────────────────────────────────────────────────

let _id = 1000;
export function nextId() { return String(++_id); }

// ── Helpers ───────────────────────────────────────────────────────────────

export function getLastInteractionDate(profile) {
  if (!profile.interactions || profile.interactions.length === 0) return null;
  return [...profile.interactions].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
}

export function getDaysSince(profile) {
  const last = getLastInteractionDate(profile);
  if (!last) return null;
  return Math.floor((new Date() - new Date(last)) / (1000 * 60 * 60 * 24));
}

export function formatDaysAgo(days) {
  if (days === null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// ── Avatar colors — warm, light backgrounds ───────────────────────────────

export const AVATAR_COLORS = [
  { bg: '#F5E7EB', text: '#7A2848' },
  { bg: '#EAF0FD', text: '#3A6BC8' },
  { bg: '#EAFAF0', text: '#2A8A5A' },
  { bg: '#FDF4EA', text: '#B86B22' },
  { bg: '#F4EAFD', text: '#7A3AC8' },
  { bg: '#EAFDF8', text: '#1A8A88' },
  { bg: '#FDEAEA', text: '#C83A3A' },
  { bg: '#F0EAFD', text: '#5A3AC8' },
];

// ── Sample profiles ───────────────────────────────────────────────────────

export const initialProfiles = [
  {
    id: '1',
    name: 'Sophia Chen',
    age: 28,
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'San Francisco, CA',
    occupation: 'Product Manager at Stripe',
    height: "5'6\"",
    lookingFor: 'Something serious',
    metOn: 'Hinge',
    status: 'active',
    vibe: 4,
    avatarColor: 0,
    interests: ['Travel', 'Wine', 'Yoga', 'Art'],
    greenFlags: ['Ambitious', 'Great sense of humor', 'Independent'],
    redFlags: [],
    firstImpression: 'Immediately captivating — sharp wit and confident without being arrogant.',
    notes: 'Has a rescue cat named Oolong. Loves natural wine. Fluent in Mandarin.',
    interactions: [
      { id: '101', date: '2026-07-28', type: 'First Date', location: 'Quince', rating: 5, note: 'Three hours felt like thirty minutes. She ordered the tasting menu without hesitation.' },
      { id: '102', date: '2026-08-03', type: 'Second Date', location: 'SFMOMA then Nopa', rating: 5, note: 'She knew more about the Kara Walker exhibition than I did. Dinner ran until midnight.' },
      { id: '103', date: '2026-08-09', type: 'Dinner', location: 'Her place', rating: 5, note: 'She cooked. Impressive.' },
    ],
    conversationHighlights: [
      { id: 'h1', text: 'Grew up in Palo Alto, did her MBA at Wharton', source: 'Hinge chat', date: '2026-07-20' },
      { id: 'h2', text: 'Wants to travel to Japan in the fall', source: 'First date', date: '2026-07-28' },
    ],
    createdAt: '2026-07-15', updatedAt: '2026-08-09',
  },
  {
    id: '2',
    name: 'Isabelle Laurent',
    age: 31,
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    location: 'New York, NY',
    occupation: 'Architect at Bjarke Ingels Group',
    height: "5'8\"",
    lookingFor: 'Long-term relationship',
    metOn: 'In person',
    status: 'active',
    vibe: 5,
    avatarColor: 1,
    interests: ['Architecture', 'Film', 'Photography', 'Travel'],
    greenFlags: ['Cultured', 'Direct', 'Passionate about her work'],
    redFlags: ['Travels constantly for projects'],
    firstImpression: 'Met at the Noguchi Museum opening. She was the most interesting person in the room.',
    notes: 'French-Canadian. Grew up in Montreal. Speaks three languages. Currently working on a project in Copenhagen.',
    interactions: [
      { id: '201', date: '2026-07-15', type: 'First Date', location: 'The NoMad Bar', rating: 5, note: 'Two bottles of Burgundy deep and still talking at 2am.' },
      { id: '202', date: '2026-07-29', type: 'Date', location: 'Dia Beacon day trip', rating: 5, note: 'Six hours of art, train rides, and one perfect thunderstorm.' },
    ],
    conversationHighlights: [
      { id: 'h3', text: 'Studied at École Polytechnique de Montréal, then Columbia', source: 'First date', date: '2026-07-15' },
      { id: 'h4', text: 'Moving to Copenhagen for 6 months in September', source: 'Text', date: '2026-07-31' },
    ],
    createdAt: '2026-07-10', updatedAt: '2026-07-29',
  },
  {
    id: '3',
    name: 'Maya Rivers',
    age: 27,
    photo: 'https://randomuser.me/api/portraits/women/33.jpg',
    location: 'Chicago, IL',
    occupation: 'Emergency Medicine Resident',
    height: "5'4\"",
    lookingFor: 'Dating casually',
    metOn: 'The League',
    status: 'prospect',
    vibe: 3,
    avatarColor: 2,
    interests: ['Fitness', 'Cooking', 'Hiking', 'Reading'],
    greenFlags: ['Incredibly smart', 'Low-maintenance'],
    redFlags: ['Unpredictable schedule', 'Not looking for anything serious'],
    firstImpression: 'Effortlessly cool. Clearly exhausted but somehow still radiant.',
    notes: 'Works brutal 80-hour weeks. Hard to schedule anything. Great on paper.',
    interactions: [
      { id: '301', date: '2026-08-01', type: 'Coffee', location: 'Intelligentsia', rating: 3, note: 'She was post-call and half asleep. Could tell there\'s something there though.' },
    ],
    conversationHighlights: [],
    createdAt: '2026-07-25', updatedAt: '2026-08-01',
  },
  {
    id: '4',
    name: 'Victoria Hayes',
    age: 30,
    photo: 'https://randomuser.me/api/portraits/women/57.jpg',
    location: 'New York, NY',
    occupation: 'M&A Attorney at Sullivan & Cromwell',
    height: "5'7\"",
    lookingFor: 'Something serious',
    metOn: 'Bumble',
    status: 'archived',
    vibe: 3,
    avatarColor: 3,
    interests: ['Golf', 'Wine', 'Travel', 'Fashion'],
    greenFlags: ['Successful', 'Knows what she wants'],
    redFlags: ['Cancelled twice', 'Very guarded'],
    firstImpression: 'Sharp and polished. Hard to read.',
    notes: 'Never quite got past surface level. Faded after the second reschedule.',
    interactions: [
      { id: '401', date: '2026-06-10', type: 'First Date', location: 'Gramercy Tavern', rating: 3, note: 'Pleasant but felt like a job interview.' },
    ],
    conversationHighlights: [],
    createdAt: '2026-06-01', updatedAt: '2026-06-10',
  },
  {
    id: '5',
    name: 'Elena Vasquez',
    age: 29,
    photo: 'https://randomuser.me/api/portraits/women/22.jpg',
    location: 'Los Angeles, CA',
    occupation: 'Culture Journalist at The Atlantic',
    height: "5'5\"",
    lookingFor: 'Figuring it out',
    metOn: 'Through friends',
    status: 'ended',
    vibe: 4,
    avatarColor: 4,
    interests: ['Film', 'Reading', 'Music', 'Art'],
    greenFlags: ['Brilliant writer', 'Deeply curious', 'Great taste'],
    redFlags: ['Lives in LA', 'Not over her ex'],
    firstImpression: 'Introduced at a dinner party. We argued about Tarkovsky for an hour.',
    notes: 'Ultimately the distance was too much. She moved back to LA in July.',
    interactions: [
      { id: '501', date: '2026-04-12', type: 'First Date', location: 'Frenchette', rating: 4, note: 'Electric conversation. She recommended six books I hadn\'t read.' },
      { id: '502', date: '2026-04-20', type: 'Date', location: 'Film Forum then drinks', rating: 5, note: 'Perfect evening.' },
      { id: '503', date: '2026-05-01', type: 'Date', location: 'The Met', rating: 4, note: 'Spent four hours in the modern wing.' },
    ],
    conversationHighlights: [
      { id: 'h5', text: 'Moved back to LA to be closer to family in July', source: 'Call', date: '2026-06-15' },
    ],
    createdAt: '2026-04-08', updatedAt: '2026-07-01',
  },
  {
    id: '6',
    name: 'Natalie Kim',
    age: 32,
    photo: 'https://randomuser.me/api/portraits/women/79.jpg',
    location: 'San Francisco, CA',
    occupation: 'Chef & Co-founder, Omakase SF',
    height: "5'3\"",
    lookingFor: 'Long-term relationship',
    metOn: 'Event',
    status: 'active',
    vibe: 4,
    avatarColor: 5,
    interests: ['Cooking', 'Food', 'Travel', 'Fitness'],
    greenFlags: ['Creative', 'Incredibly warm', 'Driven'],
    redFlags: ['Late nights every weekend'],
    firstImpression: 'Met at the James Beard dinner. She was the chef. Introduced myself after service.',
    notes: 'Her restaurant just got a Michelin star. She\'s been running on adrenaline for weeks.',
    interactions: [
      { id: '601', date: '2026-07-20', type: 'Coffee', location: 'Sightglass', rating: 4, note: 'One hour turned into three. She talks about food the way poets talk about language.' },
      { id: '602', date: '2026-08-05', type: 'Dinner', location: 'Her restaurant, after service', rating: 5, note: 'She cooked for me off-menu at midnight. The best meal of my life.' },
    ],
    conversationHighlights: [
      { id: 'h6', text: 'Trained at Noma in Copenhagen and Eleven Madison Park', source: 'Coffee date', date: '2026-07-20' },
      { id: 'h7', text: 'Dreams of opening a second, more casual neighborhood spot', source: 'Late night text', date: '2026-08-06' },
    ],
    createdAt: '2026-07-18', updatedAt: '2026-08-05',
  },
];

// ── localStorage persistence ──────────────────────────────────────────────

const STORAGE_KEY = 'database_profiles';

export function loadProfiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return initialProfiles;
}

export function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {}
}

// ── Conversation parser ───────────────────────────────────────────────────

const INTEREST_KEYWORDS = {
  'Travel':    ['travel', 'trip', 'flight', 'airport', 'vacation', 'abroad', 'passport', 'hotel'],
  'Wine':      ['wine', 'sommelier', 'vineyard', 'winery', 'burgundy', 'rosé', 'natural wine'],
  'Hiking':    ['hiking', 'hike', 'trail', 'mountain', 'outdoors', 'camping'],
  'Fitness':   ['gym', 'workout', 'running', 'marathon', 'pilates', 'crossfit', 'fitness'],
  'Cooking':   ['cook', 'recipe', 'kitchen', 'bake', 'baking', 'meal prep'],
  'Art':       ['museum', 'gallery', 'art', 'exhibition', 'artist', 'painting', 'sculpture'],
  'Music':     ['concert', 'festival', 'playlist', 'band', 'live music', 'jazz', 'classical'],
  'Film':      ['movie', 'film', 'cinema', 'director', 'screening', 'documentary'],
  'Reading':   ['book', 'reading', 'novel', 'author', 'library', 'bookstore'],
  'Yoga':      ['yoga', 'meditation', 'mindfulness', 'retreat'],
  'Dogs':      ['dog', 'puppy', 'rescue', 'pup', 'golden', 'labrador'],
  'Cats':      ['cat', 'kitten', 'kitty'],
  'Food':      ['restaurant', 'dinner', 'brunch', 'foodie', 'tasting menu', 'michelin', 'chef'],
  'Fashion':   ['fashion', 'style', 'designer', 'vintage', 'outfit'],
  'Photography': ['photo', 'photography', 'camera', 'shoot', 'portrait'],
};

export function parseConversation(text) {
  const lower = text.toLowerCase();
  const lines = text.split('\n').filter(l => l.trim());
  const findings = [];

  const detectedInterests = Object.entries(INTEREST_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => lower.includes(kw)))
    .map(([interest]) => interest);
  if (detectedInterests.length > 0)
    findings.push({ type: 'interests', value: detectedInterests, label: 'Interests detected' });

  const petMatch = lower.match(/(?:my|a|her|his)\s+(dog|cat|puppy|kitten|rescue)\s+(?:named?\s+)?([a-z]+)?/);
  if (petMatch) {
    const petName = petMatch[2];
    findings.push({ type: 'highlight', label: 'Pet', value: petName
      ? `Has a ${petMatch[1]} named ${petName[0].toUpperCase() + petName.slice(1)}`
      : `Has a ${petMatch[1]}` });
  }

  const cities = ['New York', 'San Francisco', 'LA', 'Los Angeles', 'Chicago', 'Miami', 'Boston',
    'Seattle', 'Austin', 'London', 'Paris', 'Tokyo', 'Sydney', 'Barcelona', 'Copenhagen', 'Montreal'];
  const found = cities.filter(c => text.includes(c));
  if (found.length > 0)
    findings.push({ type: 'highlight', label: 'Places', value: `Mentioned ${found.join(', ')}` });

  for (const kw of ['work at', 'works at', "i'm a", 'i am a', 'im a', 'job at']) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      findings.push({ type: 'highlight', label: 'Work mention', value: text.slice(idx, idx + 60).split('\n')[0].trim() });
      break;
    }
  }

  for (const kw of ['went to', 'studied at', 'graduated from', 'university', 'college', 'mba', 'phd']) {
    if (lower.includes(kw)) {
      const idx = lower.indexOf(kw);
      findings.push({ type: 'highlight', label: 'Education', value: text.slice(idx, idx + 80).split('\n')[0].trim() });
      break;
    }
  }

  const quote = lines.map(l => ({ text: l, len: l.length }))
    .filter(l => l.len > 40 && l.len < 200)
    .sort((a, b) => b.len - a.len)[0];
  if (quote)
    findings.push({ type: 'quote', label: 'Notable message', value: quote.text });

  return findings;
}

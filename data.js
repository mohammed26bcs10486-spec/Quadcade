/* ---------- Shared data ---------- */
const GAME_LIST = ["BGMI", "VALORANT", "FIFA", "CS2", "FREE FIRE", "LUDO KING"];

const OFFLINE_GAMES = ["Pixel Snake", "Tic-Tac-Toe", "Memory Match"];

const players = [
  { name: "arjun.exe", game: "BGMI", block: "Hostel C", status: "looking" },
  { name: "meher_04", game: "VALORANT", block: "Hostel B", status: "in-room" },
  { name: "kabir.gg", game: "LUDO KING", block: "Hostel A", status: "looking" },
  { name: "priya_ff", game: "FREE FIRE", block: "Hostel D", status: "idle" },
  { name: "rohan.cs", game: "CS2", block: "Hostel C", status: "looking" },
  { name: "sana_fc", game: "FIFA", block: "Hostel B", status: "in-room" },
  { name: "dev.bgmi", game: "BGMI", block: "Hostel A", status: "looking" },
  { name: "aisha_v", game: "VALORANT", block: "Hostel D", status: "idle" },
  { name: "yash_ludo", game: "LUDO KING", block: "Hostel C", status: "looking" },
];

const clubs = [
  { name: "Hostel C Gaming Club", game: "BGMI", members: 45, founded: "2023", tagline: "Weekly customs, floor bragging rights on the line." },
  { name: "Valorant Society", game: "VALORANT", members: 62, founded: "2022", tagline: "Scrims every Sunday, radiant push squad open." },
  { name: "Retro & Chill", game: "LUDO KING", members: 30, founded: "2024", tagline: "Ludo, chess, FIFA — low stakes, high nostalgia." },
  { name: "Esports Cell", game: "CS2", members: 58, founded: "2021", tagline: "The official campus team. Tryouts each semester." },
  { name: "Free Fire United", game: "FREE FIRE", members: 24, founded: "2023", tagline: "Casual squad, all skill levels welcome." },
  { name: "FIFA Ultimate Club", game: "FIFA", members: 19, founded: "2024", tagline: "Career mode leagues + weekend 1v1 brackets." },
];

const STORE_CATALOG = [
  { id: "frame-gold", kind: "misc", name: "Gold CRT Frame", price: 40, icon: "◆", desc: "A glowing gold border for your profile avatar." },
  { id: "frame-pink", kind: "misc", name: "Pink Scanline Frame", price: 40, icon: "◆", desc: "Magenta scanline border, arcade-cabinet style." },
  { id: "chat-green", kind: "misc", name: "Green Terminal Chat", price: 25, icon: "▮", desc: "Your lobby messages render in retro terminal green." },
  { id: "chat-gold", kind: "misc", name: "Gold Marquee Chat", price: 25, icon: "▮", desc: "Your lobby messages get a gold marquee tint." },
  { id: "title-legend", kind: "misc", name: '"Legend" Title', price: 60, icon: "★", desc: "A title tag next to your name across QUADCADE." },
  { id: "title-rookie1up", kind: "misc", name: '"1-Up" Title', price: 15, icon: "★", desc: "A playful title tag for new arrivals." },
  { id: "room-theme-pink", kind: "misc", name: "Pink Room Theme", price: 30, icon: "▦", desc: "Rooms you host get the pink pixel-frame treatment." },
  { id: "room-theme-green", kind: "misc", name: "Green Room Theme", price: 30, icon: "▦", desc: "Rooms you host get the green pixel-frame treatment." },
  { id: "sfx-pack", kind: "misc", name: "Coin SFX Pack", price: 20, icon: "♪", desc: "Extra blips and boops for joins, invites and wins." },

  /* ---- Profile logos ---- */
  { id: "logo-crown", kind: "logo", name: "Crown Logo", price: 20, icon: "♛", desc: "A small crown badge shown next to your name on your profile." },
  { id: "logo-bolt", kind: "logo", name: "Bolt Logo", price: 20, icon: "⚡", desc: "A lightning bolt badge shown next to your name on your profile." },
  { id: "logo-skull", kind: "logo", name: "Skull Logo", price: 20, icon: "☠", desc: "A skull badge shown next to your name on your profile." },
  { id: "logo-heart", kind: "logo", name: "Heart Logo", price: 20, icon: "♥", desc: "A heart badge shown next to your name on your profile." },

  /* ---- Profile banners ---- */
  { id: "banner-sunset", kind: "banner", name: "Sunset Banner", price: 35, icon: "▤", desc: "A warm gold-to-pink gradient across your profile card.", css: "linear-gradient(135deg, var(--gold), var(--pink))" },
  { id: "banner-matrix", kind: "banner", name: "Matrix Banner", price: 35, icon: "▤", desc: "A green terminal-style gradient across your profile card.", css: "linear-gradient(135deg, #04220f, var(--green))" },
  { id: "banner-arcade", kind: "banner", name: "Arcade Banner", price: 35, icon: "▤", desc: "A deep cabinet-glow gradient across your profile card.", css: "linear-gradient(135deg, var(--panel-2), var(--pink))" },

  /* ---- Alternate BGM tracks ---- */
  { id: "bgm-track-nightdrive", kind: "bgm", name: '"Night Drive" BGM', price: 45, icon: "♪", desc: "A slower, moodier chiptune loop for the lobby." },
  { id: "bgm-track-arcaderush", kind: "bgm", name: '"Arcade Rush" BGM', price: 45, icon: "♪", desc: "A faster, upbeat chiptune loop." },
  { id: "bgm-track-eightbitdrift", kind: "bgm", name: '"8-Bit Drift" BGM', price: 45, icon: "♪", desc: "A chill, drifting melody with a laid-back bassline." },
];

const DEFAULT_ROOMS = [
  { name: "BGMI Squad — need 2", game: "BGMI", host: "arjun.exe", joined: 2, max: 4, expiry: "2h left" },
  { name: "Valorant ranked push", game: "VALORANT", host: "meher_04", joined: 3, max: 5, expiry: "1h left" },
  { name: "Ludo King chaos hour 😂", game: "LUDO KING", host: "kabir.gg", joined: 3, max: 4, expiry: "Tonight" },
  { name: "FIFA after mess dinner", game: "FIFA", host: "sana_fc", joined: 1, max: 2, expiry: "4h left" },
];

const statusLabel = { looking: "Looking to play", "in-room": "In a room", idle: "Idle" };

const AVATAR_COLORS = ["gold", "pink", "green"];

/* ---------- Site sections, used by the global search bar ---------- */
const SITE_SECTIONS = [
  { label: "Lobby", sub: "Home chat", href: "index.html#lobby", keywords: "home lobby chat lobby wall message" },
  { label: "Players", sub: "Section", href: "players.html", keywords: "players online directory find people" },
  { label: "Rooms", sub: "Section", href: "rooms.html", keywords: "rooms temporary create join match" },
  { label: "Clubs", sub: "Section", href: "clubs.html", keywords: "clubs permanent squads campus" },
  { label: "Offline Games", sub: "Section", href: "games.html", keywords: "games snake tic tac toe memory match offline arcade solo" },
  { label: "Store", sub: "Section", href: "store.html", keywords: "store coins cosmetics frames titles bgm music banners logos" },
  { label: "My Profile", sub: "Section", href: "profile.html", keywords: "profile game ids avatar bio temp chat" },
];

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

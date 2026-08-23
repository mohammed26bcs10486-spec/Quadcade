let selectedGame = "ALL";
let rooms = DEFAULT_ROOMS.slice();
let joinedRoomIds = [];
let expiryTimer;
let pendingInvite = "";

const roomList = document.querySelector("#room-list");

async function loadRooms() {
  const saved = await qGet("rooms", true);
  rooms = saved && saved.length ? saved : DEFAULT_ROOMS.slice();
  const activeRooms = rooms.filter((room) => !room.expiresAt || room.expiresAt > Date.now());
  if (activeRooms.length !== rooms.length) {
    rooms = activeRooms;
    await saveRooms();
  }
}

async function loadJoinedRooms() {
  joinedRoomIds = (await qGet("joined-room-ids", false)) || [];
}

async function saveRooms() {
  await qSet("rooms", rooms, true);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function formatExpiry(room) {
  if (!room.expiresAt) return escapeHtml(room.expiry);
  const remaining = room.expiresAt - Date.now();
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  return hours <= 1 ? "under 1h left" : `${hours}h left`;
}

function renderRooms() {
  const visible = rooms.filter((r) => selectedGame === "ALL" || r.game === selectedGame);
  roomList.innerHTML = visible.length
    ? visible
        .map((r) => {
          const full = r.joined >= r.max;
          const own = r.host === "you";
          return `
    <div class="pixel-frame pink"><div class="pixel-inner room-card">
      <div class="room-card-top">
                <div><h3>${escapeHtml(r.name)}</h3><small>${escapeHtml(r.game)}</small></div>
                <span class="room-expiry">${formatExpiry(r)}</span>
      </div>
      <div class="room-bottom">
        <span class="room-players">${r.joined}/${r.max} players &middot; hosted by ${escapeHtml(r.host)}</span>
        ${own
          ? `<button class="btn-pixel small outline" data-close-room="${r.id}" type="button">CLOSE</button>`
          : `<button class="btn-pixel small ${full || joinedRoomIds.includes(r.id) ? "outline" : "gold"}" data-room="${r.id}" ${full || joinedRoomIds.includes(r.id) ? "disabled" : ""} type="button">
          ${full ? "FULL" : joinedRoomIds.includes(r.id) ? "JOINED" : "JOIN"}
        </button>`}
      </div>
    </div></div>`;
        })
        .join("")
    : `<div class="empty-state">No open rooms for this game yet. Start one &mdash; it only takes a second.</div>`;

  roomList.querySelectorAll("[data-room]").forEach((button) => {
    button.addEventListener("click", async () => {
      const room = rooms.find((r) => r.id === button.dataset.room);
      if (room && room.joined < room.max && !joinedRoomIds.includes(room.id)) {
        room.joined += 1;
        joinedRoomIds.push(room.id);
        showToast(`Joined "${room.name}"`);
        QuadcadeBGM.blip(700);
        await qSet("joined-room-ids", joinedRoomIds, false);
        await saveRooms();
        renderRooms();
      }
    });
  });
  roomList.querySelectorAll("[data-close-room]").forEach((button) => {
    button.addEventListener("click", async () => {
      rooms = rooms.filter((room) => room.id !== button.dataset.closeRoom);
      await saveRooms();
      renderCustomGameChips();
      renderRooms();
      showToast("Room closed");
    });
  });
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedGame = chip.dataset.game;
    renderRooms();
  });
});

/* ---------- Create room form ---------- */
const newRoomButton = document.querySelector("#new-room-button");
const roomForm = document.querySelector("#room-form");
const roomCancel = document.querySelector("#room-cancel");
const roomGame = document.querySelector("#room-game");
const customGameField = document.querySelector("#custom-game-field");
const customGameInput = document.querySelector("#room-custom-game");
const customGameChips = document.querySelector("#custom-game-chips");
const inviteNote = document.querySelector("#invite-note");

function renderCustomGameChips() {
  const customGames = [...new Set(rooms.map((room) => room.game).filter((game) => !GAME_LIST.includes(game)))];
  customGameChips.innerHTML = customGames
    .map((game) => `<button class="chip" data-game="${escapeHtml(game)}" type="button">${escapeHtml(game)}</button>`)
    .join("");
  customGameChips.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      selectedGame = chip.dataset.game;
      renderRooms();
    });
  });
}

function updateCustomGameField() {
  const isCustom = roomGame.value === "CUSTOM";
  customGameField.hidden = !isCustom;
  customGameInput.required = isCustom;
  if (!isCustom) customGameInput.value = "";
}

roomGame.addEventListener("change", updateCustomGameField);

newRoomButton.addEventListener("click", () => {
  roomForm.hidden = !roomForm.hidden;
});
roomCancel.addEventListener("click", () => {
  roomForm.hidden = true;
});
roomForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.querySelector("#room-name").value.trim();
  const game = roomGame.value === "CUSTOM" ? customGameInput.value.trim() : roomGame.value;
  const max = Number(document.querySelector("#room-max").value) || 4;
  const expiry = document.querySelector("#room-expiry").value;
  const expiryHours = expiry === "Tonight" ? 24 : Number.parseInt(expiry, 10);
  if (!name || !game) return;
  rooms.unshift({
    id: `r-${Date.now()}`,
    name,
    game,
    host: "you",
    invitedPlayer: pendingInvite,
    joined: 1,
    max,
    expiry: expiry === "Tonight" ? "Tonight" : `${expiry} left`,
    expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
  });
  roomForm.reset();
  updateCustomGameField();
  roomForm.hidden = true;
  showToast(pendingInvite ? `Room created — invite ready for ${pendingInvite}` : "Room created — visible to everyone on your network");
  pendingInvite = "";
  inviteNote.hidden = true;
  QuadcadeBGM.blip(880);
  await saveRooms();
  renderCustomGameChips();
  renderRooms();
});

/* ---------- Preset from an offline game's "take it online" button ---------- */
function applyGamePreset() {
  const params = new URLSearchParams(location.search);
  const game = params.get("game");
  const prefill = params.get("prefill");
  const invite = params.get("invite");
  if (game && GAME_LIST.includes(game)) {
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.game === game));
    selectedGame = game;
    roomForm.hidden = false;
    document.querySelector("#room-game").value = game;
  }
  if (prefill) {
    roomForm.hidden = false;
    document.querySelector("#room-name").value = `${prefill} — anyone up?`;
  }
  if (invite) {
    pendingInvite = invite;
    roomForm.hidden = false;
    document.querySelector("#room-name").value = `Room with ${invite}`;
    inviteNote.hidden = false;
    inviteNote.textContent = `Invite ready for ${invite}. Create the room to send it.`;
  }
  if (game || prefill || invite) document.querySelector("#room-name").focus();
}

(async function init() {
  rooms.forEach((r, i) => (r.id = r.id || `seed-${i}`));
  await loadJoinedRooms();
  await loadRooms();
  rooms.forEach((r, i) => (r.id = r.id || `seed-${i}`));
  renderCustomGameChips();
  renderRooms();
  applyGamePreset();
  expiryTimer = setInterval(async () => {
    const before = rooms.length;
    rooms = rooms.filter((room) => !room.expiresAt || room.expiresAt > Date.now());
    if (rooms.length !== before) await saveRooms();
    renderRooms();
  }, 60000);
})();

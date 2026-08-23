const DEFAULT_PROFILE = {
  name: "you",
  block: "Hostel C",
  bio: "",
  status: "looking",
  color: "gold",
  gameIds: {},
  logo: "",
  banner: "",
};

let profile = { ...DEFAULT_PROFILE };
let customGameRows = []; // extra {game, id} pairs beyond the built-in GAME_LIST

/* ---------- Build the game-id inputs ---------- */
const gameidGrid = document.querySelector("#gameid-grid");
gameidGrid.innerHTML = GAME_LIST.map(
  (g) => `
  <label class="field">${g} ID
    <input type="text" data-game-id="${g}" placeholder="your ${g} username" />
  </label>`
).join("");

/* ---------- Custom (any-game) IDs ---------- */
const customGameList = document.querySelector("#custom-gameid-list");
const addGameIdButton = document.querySelector("#add-gameid-button");

function renderCustomGameRows() {
  customGameList.innerHTML = customGameRows
    .map(
      (row, i) => `
    <div class="custom-gameid-row" data-row="${i}">
      <label class="field">Game name
        <input type="text" data-custom-game="${i}" placeholder="e.g. Chess.com" value="${escapeAttr(row.game)}" />
      </label>
      <label class="field">Your ID
        <input type="text" data-custom-id="${i}" placeholder="your username" value="${escapeAttr(row.id)}" />
      </label>
      <button class="remove-row-btn" type="button" data-remove="${i}" aria-label="Remove this game">&times;</button>
    </div>`
    )
    .join("");

  customGameList.querySelectorAll("[data-custom-game]").forEach((input) => {
    input.addEventListener("input", (e) => {
      customGameRows[Number(e.target.dataset.customGame)].game = e.target.value;
    });
  });
  customGameList.querySelectorAll("[data-custom-id]").forEach((input) => {
    input.addEventListener("input", (e) => {
      customGameRows[Number(e.target.dataset.customId)].id = e.target.value;
    });
  });
  customGameList.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      customGameRows.splice(Number(e.target.dataset.remove), 1);
      renderCustomGameRows();
    });
  });
}

function escapeAttr(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

addGameIdButton.addEventListener("click", () => {
  customGameRows.push({ game: "", id: "" });
  renderCustomGameRows();
  QuadcadeBGM.blip(600);
  const rows = customGameList.querySelectorAll("[data-custom-game]");
  rows[rows.length - 1]?.focus();
});

/* ---------- Avatar preview ---------- */
function refreshPreview() {
  const avatar = document.querySelector("#avatar-preview");
  const colorVar = `var(--${profile.color})`;
  const textColor = { gold: "#1a1305", pink: "#1a0512", green: "#04220f" }[profile.color];
  avatar.style.background = colorVar;
  avatar.style.color = textColor;
  avatar.textContent = initials(profile.name || "you");
  document.querySelector("#name-preview").textContent = profile.name || "you";
  document.querySelector("#block-preview").textContent = profile.block;
}

/* ---------- Logo + banner preview ---------- */
function applyCosmetics() {
  const logoItem = STORE_CATALOG.find((i) => i.id === profile.logo && i.kind === "logo");
  const logoPreview = document.querySelector("#logo-preview");
  if (logoPreview) logoPreview.textContent = logoItem ? logoItem.icon : "";

  const bannerItem = STORE_CATALOG.find((i) => i.id === profile.banner && i.kind === "banner");
  const card = document.querySelector(".profile-card");
  if (card) card.style.background = bannerItem ? bannerItem.css : "";
}

/* ---------- Avatar color picker ---------- */
document.querySelectorAll(".avatar-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    document.querySelectorAll(".avatar-swatch").forEach((s) => s.classList.remove("selected"));
    swatch.classList.add("selected");
    profile.color = swatch.dataset.color;
    refreshPreview();
    QuadcadeBGM.blip(600);
  });
});

/* ---------- Logo / banner pickers ---------- */
const logoPicker = document.querySelector("#logo-picker");
const bannerPicker = document.querySelector("#banner-picker");
const statusPicker = document.querySelector("#field-status");
logoPicker.addEventListener("change", () => {
  profile.logo = logoPicker.value;
  applyCosmetics();
});
bannerPicker.addEventListener("change", () => {
  profile.banner = bannerPicker.value;
  applyCosmetics();
});

/* ---------- Load / populate ---------- */
async function loadProfile() {
  const saved = await qGet("profile", false);
  profile = { ...DEFAULT_PROFILE, ...(saved || {}), gameIds: { ...(saved && saved.gameIds) } };

  document.querySelector("#field-name").value = profile.name;
  document.querySelector("#field-block").value = profile.block;
  document.querySelector("#field-bio").value = profile.bio;
  statusPicker.value = profile.status || DEFAULT_PROFILE.status;
  document.querySelectorAll(".avatar-swatch").forEach((s) => s.classList.toggle("selected", s.dataset.color === profile.color));
  document.querySelectorAll("[data-game-id]").forEach((input) => {
    input.value = profile.gameIds[input.dataset.gameId] || "";
  });

  customGameRows = Object.entries(profile.gameIds)
    .filter(([game]) => !GAME_LIST.includes(game))
    .map(([game, id]) => ({ game, id }));
  renderCustomGameRows();

  refreshPreview();
}

async function loadBadgesAndCoins() {
  const owned = (await qGet("store-owned", false)) || [];
  const coins = (await qGet("coins", false)) ?? 120;
  document.querySelector("#coin-amount").textContent = coins;
  const badgeRow = document.querySelector("#badge-row");
  const titles = owned
    .map((id) => STORE_CATALOG.find((item) => item.id === id))
    .filter((item) => item && item.id.startsWith("title-"));
  badgeRow.innerHTML = titles.length
    ? titles.map((t) => `<span class="mini-badge">${t.name}</span>`).join("")
    : `<span class="mini-badge">No titles yet — check the store</span>`;

  const ownedLogos = owned.map((id) => STORE_CATALOG.find((i) => i.id === id)).filter((i) => i && i.kind === "logo");
  const ownedBanners = owned.map((id) => STORE_CATALOG.find((i) => i.id === id)).filter((i) => i && i.kind === "banner");
  logoPicker.innerHTML = `<option value="">None</option>` + ownedLogos.map((i) => `<option value="${i.id}">${i.icon} ${i.name}</option>`).join("");
  bannerPicker.innerHTML = `<option value="">None</option>` + ownedBanners.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
  logoPicker.value = ownedLogos.some((i) => i.id === profile.logo) ? profile.logo : "";
  bannerPicker.value = ownedBanners.some((i) => i.id === profile.banner) ? profile.banner : "";
  if (logoPicker.value !== profile.logo) profile.logo = logoPicker.value;
  if (bannerPicker.value !== profile.banner) profile.banner = bannerPicker.value;
  applyCosmetics();
}

async function loadInvitations() {
  const inviteList = document.querySelector("#invite-list");
  const invites = (await qGet(`invites:${profile.name}`, true)) || [];
  inviteList.innerHTML = "";
  if (!invites.length) {
    inviteList.textContent = "No pending invitations.";
    inviteList.className = "invite-list muted-note";
    return;
  }
  invites.slice().reverse().forEach((invite) => {
    const row = document.createElement("div");
    row.className = "invite-item";
    row.textContent = `${invite.from} invited you to a ${invite.game} room.`;
    inviteList.append(row);
  });
}

/* ---------- Save ---------- */
document.querySelector("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  profile.name = document.querySelector("#field-name").value.trim() || "you";
  profile.block = document.querySelector("#field-block").value;
  profile.bio = document.querySelector("#field-bio").value.trim();
  profile.status = statusPicker.value;
  profile.gameIds = {};
  document.querySelectorAll("[data-game-id]").forEach((input) => {
    if (input.value.trim()) profile.gameIds[input.dataset.gameId] = input.value.trim();
  });
  customGameRows.forEach((row) => {
    const g = row.game.trim();
    const id = row.id.trim();
    if (g && id) profile.gameIds[g] = id;
  });

  await qSet("profile", profile, false);
  await qSet("profile-setup-done", true, false);
  refreshPreview();
  applyCosmetics();
  populateTempChatRecipients();
  document.querySelector("#save-hint").textContent = "Saved just now.";
  showToast("Profile saved");
  QuadcadeBGM.blip(880);

  const params = new URLSearchParams(location.search);
  if (params.get("first") === "1") {
    document.querySelector("#save-hint").textContent = "Saved — heading to the Lobby...";
    setTimeout(() => {
      location.href = "index.html";
    }, 800);
  }
});

document.querySelector("#reset-profile").addEventListener("click", async () => {
  if (!window.confirm("Reset your profile and saved cosmetics?")) return;
  await qSet("profile", DEFAULT_PROFILE, false);
  await qSet("profile-setup-done", false, false);
  location.href = "profile.html?first=1";
});

document.querySelector("#export-profile").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "quadcade-profile.json";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Profile exported");
});

document.querySelector("#import-profile").addEventListener("click", () => {
  document.querySelector("#profile-file").click();
});

document.querySelector("#profile-file").addEventListener("change", () => {
  const file = document.querySelector("#profile-file").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || typeof imported !== "object" || typeof imported.name !== "string") throw new Error("invalid profile");
      profile = {
        ...DEFAULT_PROFILE,
        ...imported,
        gameIds: imported.gameIds && typeof imported.gameIds === "object" ? imported.gameIds : {},
      };
      await qSet("profile", profile, false);
      await qSet("profile-setup-done", true, false);
      location.reload();
    } catch (error) {
      showToast("Invalid profile file");
    }
  });
  reader.readAsText(file);
});

/* ---------- Temp chat (ephemeral, in-memory only) ---------- */
const tempChatWith = document.querySelector("#temp-chat-with");
const tempMessages = document.querySelector("#temp-messages");
const tempThreads = {};

function populateTempChatRecipients() {
  const previousSelection = tempChatWith.value;
  const others = players.filter((p) => p.name !== profile.name);
  tempChatWith.innerHTML = others.map((p) => `<option value="${p.name}">${p.name}</option>`).join("");
  // Keep whoever you were chatting with selected instead of always
  // snapping back to the first player (this was silently "losing" chats).
  if (others.some((p) => p.name === previousSelection)) {
    tempChatWith.value = previousSelection;
  }
  renderTempThread();
}

function renderTempThread() {
  const who = tempChatWith.value;
  const thread = tempThreads[who] || [];
  tempMessages.innerHTML = "";
  if (!thread.length) {
    const empty = document.createElement("p");
    empty.style.color = "var(--muted)";
    empty.textContent = `No messages yet — say hi to ${who || "someone"}.`;
    tempMessages.append(empty);
  } else {
    thread.forEach((m) => {
      const p = document.createElement("p");
      const b = document.createElement("b");
      b.textContent = m.from;
      const span = document.createElement("span");
      span.textContent = ` ${m.text}`;
      p.append(b, span);
      tempMessages.append(p);
    });
  }
  tempMessages.scrollTop = tempMessages.scrollHeight;
}

tempChatWith.addEventListener("change", renderTempThread);

document.querySelector("#temp-chat-clear").addEventListener("click", () => {
  const who = tempChatWith.value;
  tempThreads[who] = [];
  renderTempThread();
  showToast("Temp chat cleared");
});

document.querySelector("#temp-chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#temp-chat-input");
  const text = input.value.trim();
  const who = tempChatWith.value;
  if (!text || !who) return;
  tempThreads[who] = tempThreads[who] || [];
  tempThreads[who].push({ from: "you", text });
  input.value = "";
  renderTempThread();
  QuadcadeBGM.blip(520);

  // A light, canned reply so the temp chat still feels alive in this demo.
  setTimeout(() => {
    tempThreads[who].push({ from: who, text: "👍 saw it, give me a min" });
    if (tempChatWith.value === who) renderTempThread();
  }, 900);
});

(async function init() {
  await loadProfile();
  await loadBadgesAndCoins();
  populateTempChatRecipients();
  loadInvitations();
})();

let selectedGame = "ALL";

const playerList = document.querySelector("#player-list");
const playerCount = document.querySelector("#player-count");
const search = document.querySelector("#global-search");
const myStatusNote = document.querySelector("#my-status-note");

async function loadMyStatus() {
  const profile = await qGet("profile", false);
  const status = profile?.status || "looking";
  myStatusNote.textContent = `YOUR STATUS: ${status === "looking" ? "LOOKING TO PLAY" : status.toUpperCase()}`;
}

function renderPlayers() {
  const query = search.value.toLowerCase().trim();
  const visible = players.filter((p) => {
    const matchesGame = selectedGame === "ALL" || p.game === selectedGame;
    const matchesQuery = `${p.name} ${p.game} ${p.block}`.toLowerCase().includes(query);
    return matchesGame && matchesQuery;
  });
  playerCount.textContent = `${visible.length} on your network`;
  playerList.innerHTML = visible.length
    ? visible
        .map(
          (p) => `
    <div class="pixel-frame"><div class="pixel-inner player-card">
      <div class="player-top">
        <span class="pixel-avatar">${initials(p.name)}</span>
        <div><strong>${p.name}</strong><small>${p.game}</small></div>
      </div>
      <div class="player-meta">
        <span>${p.block}</span>
        <span class="status-tag ${p.status}">${statusLabel[p.status]}</span>
      </div>
        <button class="btn-pixel small outline" data-invite-player="${encodeURIComponent(p.name)}" data-invite-game="${encodeURIComponent(p.game)}" type="button">INVITE TO ROOM</button>
    </div></div>`
        )
        .join("")
    : `<div class="empty-state">No one online for this game right now. <a href="rooms.html" class="view-all">Create a room</a> instead.</div>`;
  attachToastHandlers();
    document.querySelectorAll("[data-invite-player]").forEach((el) => {
      el.addEventListener("click", async () => {
        const player = decodeURIComponent(el.dataset.invitePlayer);
        const game = decodeURIComponent(el.dataset.inviteGame);
        const profile = await qGet("profile", false);
        const key = `invites:${player}`;
        const invites = (await qGet(key, true)) || [];
        invites.push({ from: profile?.name || "you", game, createdAt: Date.now() });
        await qSet(key, invites.slice(-20), true);
        location.href = `rooms.html?invite=${player}&game=${game}`;
      });
  });
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedGame = chip.dataset.game;
    renderPlayers();
  });
});
search.addEventListener("input", renderPlayers);

/* Prefill from the topbar site search (players.html?q=name) */
(function applyQueryPrefill() {
  const q = new URLSearchParams(location.search).get("q");
  if (q) search.value = q;
})();

renderPlayers();
loadMyStatus();

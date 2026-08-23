/* ---------- Homepage previews ---------- */
(async function renderPreviews() {
  const rooms = (await qGet("rooms", true)) || DEFAULT_ROOMS;

  const playerPreview = document.querySelector("#player-preview");
  playerPreview.innerHTML = players
    .slice(0, 3)
    .map(
      (p) => `
    <div class="pixel-frame"><div class="pixel-inner teaser-card">
      <span class="tag">${statusLabel[p.status]}</span>
      <h3>${p.name}</h3>
      <p>${p.game} &middot; ${p.block}</p>
    </div></div>`
    )
    .join("");

  const roomPreview = document.querySelector("#room-preview");
  roomPreview.innerHTML = rooms
    .slice(0, 3)
    .map(
      (r) => `
    <div class="pixel-frame pink"><div class="pixel-inner teaser-card">
      <span class="tag" style="color:var(--pink)">${r.expiry}</span>
      <h3>${r.name}</h3>
      <p>${r.game} &middot; ${r.joined}/${r.max} players &middot; hosted by ${r.host}</p>
    </div></div>`
    )
    .join("");

  const clubPreview = document.querySelector("#club-preview");
  clubPreview.innerHTML = clubs
    .slice(0, 3)
    .map(
      (c) => `
    <div class="pixel-frame green"><div class="pixel-inner teaser-card">
      <span class="tag">${c.members} members</span>
      <h3>${c.name}</h3>
      <p>${c.tagline}</p>
    </div></div>`
    )
    .join("");
})();

/* ---------- Lobby chat ---------- */
const chatBox = document.querySelector("#messages");
const starterMessages = [...chatBox.querySelectorAll("p")].map((message) => ({
  from: message.querySelector("b").textContent,
  text: message.querySelector("span").textContent,
}));
let lobbyMessages = [];

function renderLobbyMessages() {
  chatBox.innerHTML = "";
  lobbyMessages.forEach((message) => {
    const row = document.createElement("p");
    const name = document.createElement("b");
    const text = document.createElement("span");
    name.textContent = message.from;
    text.textContent = message.text;
    row.append(name, text);
    chatBox.append(row);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

(async function loadLobbyMessages() {
  lobbyMessages = (await qGet("lobby-messages", true)) || starterMessages;
  renderLobbyMessages();
})();

document.querySelector("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#chat-input");
  const text = input.value.trim();
  if (!text) return;
  lobbyMessages.push({ from: "you", text });
  lobbyMessages = lobbyMessages.slice(-50);
  renderLobbyMessages();
  await qSet("lobby-messages", lobbyMessages, true);
  input.value = "";
  QuadcadeBGM.blip(520);
});

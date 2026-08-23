let selectedGame = "ALL";
const clubList = document.querySelector("#club-list");

function renderClubs() {
  const visible = clubs.filter((c) => selectedGame === "ALL" || c.game === selectedGame);
  clubList.innerHTML = visible.length
    ? visible
        .map(
          (c) => `
    <div class="pixel-frame green"><div class="pixel-inner club-card">
      <h3>${c.name}</h3>
      <p>${c.tagline}</p>
      <div class="club-meta"><span>${c.members} members</span><span>Est. ${c.founded}</span></div>
      <button class="btn-pixel small outline" data-toast="Request sent to ${c.name}" type="button">JOIN CLUB</button>
    </div></div>`
        )
        .join("")
    : `<div class="empty-state">No clubs for this game yet &mdash; maybe start one?</div>`;
  attachToastHandlers();
  document.querySelectorAll("[data-toast]").forEach((el) => el.addEventListener("click", () => QuadcadeBGM.blip(700)));
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedGame = chip.dataset.game;
    renderClubs();
  });
});

renderClubs();

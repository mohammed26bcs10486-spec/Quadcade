let coins = 120;
let owned = [];
let equippedTrack = "classic";

async function loadWallet() {
  coins = (await qGet("coins", false)) ?? 120;
  owned = (await qGet("store-owned", false)) || [];
  equippedTrack = (await qGet("bgm-track", false)) || "classic";
  document.querySelectorAll("#coin-amount").forEach((el) => (el.textContent = coins));
}

async function saveWallet() {
  await qSet("coins", coins, false);
  await qSet("store-owned", owned, false);
  document.querySelectorAll("#coin-amount").forEach((el) => (el.textContent = coins));
}

function renderStore() {
  const list = document.querySelector("#store-list");
  document.querySelector("#owned-count").textContent = `${owned.length}/${STORE_CATALOG.length} owned`;
  list.innerHTML = STORE_CATALOG.map((item) => {
    const isOwned = owned.includes(item.id);
    const canAfford = coins >= item.price;
    const isTrack = item.kind === "bgm";
    const isEquipped = isTrack && equippedTrack === item.id;

    let actionHtml;
    if (!isOwned) {
      actionHtml = `<div class="store-price"><span class="coin-icon"></span><span>${item.price}</span></div>
        <button class="btn-pixel small ${canAfford ? "gold" : "outline"}" data-buy="${item.id}" ${canAfford ? "" : "disabled"} type="button">
          ${canAfford ? "BUY" : "NOT ENOUGH COINS"}
        </button>`;
    } else if (isTrack) {
      actionHtml = `<button class="btn-pixel small ${isEquipped ? "outline" : "gold"}" data-equip="${item.id}" ${isEquipped ? "disabled" : ""} type="button">
          ${isEquipped ? "EQUIPPED — PLAYING" : "EQUIP TRACK"}
        </button>`;
    } else if (item.kind === "logo" || item.kind === "banner") {
      actionHtml = `<span class="owned-tag">OWNED — set it on your Profile page</span>`;
    } else {
      actionHtml = `<span class="owned-tag">OWNED</span>`;
    }

    return `
    <div class="pixel-frame"><div class="pixel-inner store-card">
      <div class="store-icon"${item.css ? ` style="background:${item.css}"` : ""}>${item.icon}</div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      ${actionHtml}
    </div></div>`;
  }).join("");

  list.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = STORE_CATALOG.find((i) => i.id === btn.dataset.buy);
      if (!item || coins < item.price || owned.includes(item.id)) return;
      coins -= item.price;
      owned.push(item.id);
      await saveWallet();
      renderStore();
      showToast(`Bought "${item.name}"`);
      QuadcadeBGM.blip(1040);
    });
  });

  list.querySelectorAll("[data-equip]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = STORE_CATALOG.find((i) => i.id === btn.dataset.equip);
      if (!item || !owned.includes(item.id)) return;
      equippedTrack = item.id;
      await qSet("bgm-track", equippedTrack, false);
      QuadcadeBGM.setTrack(equippedTrack);
      if (!QuadcadeBGM.isPlaying()) QuadcadeBGM.start();
      renderStore();
      showToast(`Now playing ${item.name}`);
    });
  });
}

document.querySelector("#claim-bonus").addEventListener("click", async () => {
  const today = new Date().toDateString();
  const lastClaim = await qGet("daily-bonus-date", false);
  const btn = document.querySelector("#claim-bonus");
  if (lastClaim === today) {
    showToast("Already claimed today — come back tomorrow");
    return;
  }
  coins += 20;
  await qSet("daily-bonus-date", today, false);
  await saveWallet();
  renderStore();
  btn.textContent = "CLAIMED FOR TODAY";
  btn.disabled = true;
  showToast("+20 coins");
  QuadcadeBGM.blip(920);
});

(async function init() {
  await loadWallet();
  renderStore();
  const today = new Date().toDateString();
  const lastClaim = await qGet("daily-bonus-date", false);
  if (lastClaim === today) {
    const btn = document.querySelector("#claim-bonus");
    btn.textContent = "CLAIMED FOR TODAY";
    btn.disabled = true;
  }
})();

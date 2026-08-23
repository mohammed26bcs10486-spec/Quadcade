/* ---------- First-run gate ----------
   The very first time QUADCADE opens (no profile saved yet), send the
   player to their Profile page to set up before anything else. Once a
   profile has been saved, every page loads normally and the homepage
   defaults to the Lobby (see the boot-complete handler in home.js). */
(async function firstRunGate() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "profile.html") return;
  const done = await qGet("profile-setup-done", false);
  if (!done) {
    location.replace("profile.html?first=1");
  }
})();

/* ---------- Boot sequence ---------- */
(function boot() {
  const screen = document.querySelector("#boot-screen");
  if (!screen) return;
  const line2 = document.querySelector("#boot-line-2");
  const line3 = document.querySelector("#boot-line-3");
  const skip = document.querySelector("#boot-skip");

  const timers = [
    setTimeout(() => line2 && (line2.hidden = false), 500),
    setTimeout(() => line3 && (line3.hidden = false), 1000),
  ];
  const finish = () => {
    timers.forEach(clearTimeout);
    screen.classList.add("hidden");
    document.dispatchEvent(new CustomEvent("quadcade:booted"));
  };
  const autoFinish = setTimeout(finish, 1700);
  skip.addEventListener("click", () => {
    clearTimeout(autoFinish);
    finish();
    QuadcadeBGM.blip(660);
  });
})();

/* ---------- Toast ---------- */
function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function attachToastHandlers() {
  document.querySelectorAll("[data-toast]").forEach((el) => {
    el.addEventListener("click", () => showToast(el.dataset.toast));
  });
}

/* ---------- Active nav link ---------- */
(function markActiveNav() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".top-nav a[data-page]").forEach((a) => {
    if (a.dataset.page === page) a.classList.add("active");
  });
})();

/* ---------- Global site search ----------
   Lives in the topbar on every page. Matches against the fixed list of
   site sections plus the player directory, and jumps straight there. */
function initSiteSearch() {
  const input = document.querySelector("#site-search");
  const results = document.querySelector("#site-search-results");
  if (!input || !results) return;

  let activeIndex = -1;

  function computeMatches(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return [];
    const sectionMatches = (typeof SITE_SECTIONS !== "undefined" ? SITE_SECTIONS : [])
      .filter((s) => `${s.label} ${s.keywords}`.toLowerCase().includes(q))
      .map((s) => ({ label: s.label, sub: s.sub, href: s.href }));
    const playerMatches = (typeof players !== "undefined" ? players : [])
      .filter((p) => `${p.name} ${p.game} ${p.block}`.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({ label: p.name, sub: `${p.game} · ${p.block}`, href: `players.html?q=${encodeURIComponent(p.name)}` }));
    return [...sectionMatches, ...playerMatches].slice(0, 8);
  }

  function render(matches) {
    activeIndex = -1;
    const query = input.value.trim();
    if (!query) {
      results.innerHTML = "";
      results.classList.remove("open");
      return;
    }
    results.innerHTML = matches.length
      ? matches
          .map(
            (m, i) => `
        <div class="result" data-href="${m.href}" data-index="${i}">
          <span>${m.label}</span><small>${m.sub}</small>
        </div>`
          )
          .join("")
      : `<div class="no-results">No matches for &ldquo;${query}&rdquo;</div>`;
    results.classList.add("open");
    results.querySelectorAll("[data-href]").forEach((el) => {
      el.addEventListener("click", () => {
        location.href = el.dataset.href;
      });
    });
  }

  input.addEventListener("input", () => render(computeMatches(input.value)));
  input.addEventListener("focus", () => {
    if (input.value.trim()) render(computeMatches(input.value));
  });
  input.addEventListener("keydown", (e) => {
    const items = [...results.querySelectorAll("[data-href]")];
    if (e.key === "ArrowDown") {
      if (!items.length) return;
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === "Enter") {
      if (items[activeIndex]) {
        e.preventDefault();
        location.href = items[activeIndex].dataset.href;
      }
      return;
    } else if (e.key === "Escape") {
      results.classList.remove("open");
      return;
    } else {
      return;
    }
    items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: "nearest" });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-search-wrap")) results.classList.remove("open");
  });
}

function initMobileMenu() {
  const header = document.querySelector(".topbar");
  const nav = header?.querySelector(".top-nav");
  if (!header || !nav) return;

  const toggle = document.createElement("button");
  toggle.className = "mobile-menu-toggle";
  toggle.type = "button";
  toggle.textContent = "MENU";
  toggle.setAttribute("aria-label", "Open navigation");
  toggle.setAttribute("aria-expanded", "false");
  header.insertBefore(toggle, nav);

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("mobile-open");
    toggle.textContent = open ? "CLOSE" : "MENU";
    toggle.setAttribute("aria-label", `${open ? "Close" : "Open"} navigation`);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("mobile-open");
      toggle.textContent = "MENU";
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const SITE_THEMES = ["neon", "terminal", "sunset"];

function applyTheme(theme) {
  const selected = SITE_THEMES.includes(theme) ? theme : "neon";
  document.documentElement.dataset.theme = selected;
  return selected;
}

async function initThemePicker() {
  const header = document.querySelector(".topbar");
  const actions = header?.querySelector(".nav-right");
  if (!actions) return;

  const button = document.createElement("button");
  button.className = "theme-toggle";
  button.type = "button";
  actions.insertBefore(button, actions.firstChild);

  let theme = applyTheme((await qGet("site-theme", false)) || "neon");
  const updateButton = () => {
    button.textContent = `THEME: ${theme.toUpperCase()}`;
    button.setAttribute("aria-label", `Change theme, currently ${theme}`);
  };
  updateButton();
  button.addEventListener("click", async () => {
    theme = SITE_THEMES[(SITE_THEMES.indexOf(theme) + 1) % SITE_THEMES.length];
    applyTheme(theme);
    updateButton();
    await qSet("site-theme", theme, false);
  });
}

function initPageTransition() {
  document.body.classList.add("page-ready");
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link.target || link.hasAttribute("download") || event.defaultPrevented) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    event.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => { location.href = link.href; }, 180);
  });
}

async function initCoinBalance() {
  const amount = document.querySelector("#coin-amount");
  if (!amount) return;
  amount.textContent = (await qGet("coins", false)) ?? 120;
}

/* ---------- Init BGM toggle + search on load ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initBGMToggle();
  initSiteSearch();
  initMobileMenu();
  initThemePicker();
  initPageTransition();
  initCoinBalance();
});

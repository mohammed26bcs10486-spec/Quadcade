/* ---------- Modal plumbing ---------- */
const backdrop = document.querySelector("#game-modal-backdrop");
const modalTitle = document.querySelector("#game-modal-title");
const modalBody = document.querySelector("#game-modal-body");
const modalStatus = document.querySelector("#game-modal-status");
let activeCleanup = null;
let leaderboardFilter = "ALL";

const DEFAULT_GAME_STATS = { played: 0, wins: 0, coinsEarned: 0 };

async function recordGameStart() {
  const stats = { ...DEFAULT_GAME_STATS, ...((await qGet("game-stats", false)) || {}) };
  stats.played += 1;
  await qSet("game-stats", stats, false);
  renderGameStats(stats);
}

async function recordGameWin(game) {
  const stats = { ...DEFAULT_GAME_STATS, ...((await qGet("game-stats", false)) || {}) };
  stats.wins += 1;
  stats.coinsEarned += 1;
  await qSet("game-stats", stats, false);
  const profile = await qGet("profile", false);
  const leaderboard = (await qGet("leaderboard", true)) || [];
  const name = profile?.name || "you";
  const existing = leaderboard.find((entry) => entry.name === name && entry.game === game);
  if (existing) existing.wins = stats.wins;
  else leaderboard.push({ name, wins: stats.wins, game });
  await qSet("leaderboard", leaderboard, true);
  renderGameStats(stats, leaderboard);
}

function renderGameStats(stats, leaderboard = []) {
  document.querySelector("#games-played").textContent = stats.played;
  document.querySelector("#games-won").textContent = stats.wins;
  document.querySelector("#coins-earned").textContent = stats.coinsEarned;
  const rows = leaderboard
    .filter((entry) => leaderboardFilter === "ALL" || !entry.game || entry.game === leaderboardFilter)
    .slice().sort((a, b) => b.wins - a.wins).slice(0, 5);
  document.querySelector("#leaderboard").innerHTML = rows.length
    ? `<h3>HIGH SCORES</h3>${rows.map((entry, index) => `<p><b>#${index + 1} ${escapeGameText(entry.name)}</b><span>${entry.wins} wins</span></p>`).join("")}`
    : `<p class="muted-note">Win a game to enter the high scores.</p>`;
}

function escapeGameText(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

async function loadGameStats() {
  const stats = { ...DEFAULT_GAME_STATS, ...((await qGet("game-stats", false)) || {}) };
  renderGameStats(stats, (await qGet("leaderboard", true)) || []);
}

async function rewardGameWin(game) {
  const coins = (await qGet("coins", false)) ?? 120;
  await qSet("coins", coins + 1, false);
  await recordGameWin(game);
  showToast("+1 coin for winning!");
}

function openModal(title) {
  modalTitle.textContent = title;
  modalStatus.textContent = "";
  backdrop.classList.add("open");
}
function closeModal() {
  backdrop.classList.remove("open");
  modalBody.innerHTML = "";
  if (activeCleanup) activeCleanup();
  activeCleanup = null;
}
document.querySelector("#game-modal-close").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

document.querySelectorAll("[data-online]").forEach((btn) => {
  btn.addEventListener("click", () => {
    QuadcadeBGM.blip(760);
    location.href = `rooms.html?prefill=${encodeURIComponent(btn.dataset.online)}`;
  });
});

document.querySelectorAll("[data-play]").forEach((btn) => {
  btn.addEventListener("click", () => {
    QuadcadeBGM.blip(660);
    const kind = btn.dataset.play;
    if (kind === "snake") startSnake();
    if (kind === "ttt") startTTT();
    if (kind === "memory") startMemory();
  });
});

/* ================= SNAKE ================= */
function startSnake() {
  recordGameStart("snake");
  openModal("Pixel Snake");
  const size = 16;
  const cell = 18;
  modalBody.innerHTML = `<canvas id="snake-canvas" width="${size * cell}" height="${size * cell}"></canvas>
    <p class="muted-note">Arrow keys to steer. Eat the gold pixel, don't hit yourself.</p>`;
  const canvas = document.querySelector("#snake-canvas");
  const ctx = canvas.getContext("2d");

  let snake = [{ x: 8, y: 8 }];
  let dir = { x: 1, y: 0 };
  let nextDir = dir;
  let food = spawnFood();
  let score = 0;
  let alive = true;

  function spawnFood() {
    return { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
  }

  function draw() {
    ctx.fillStyle = "#050410";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffb400";
    ctx.fillRect(food.x * cell, food.y * cell, cell - 2, cell - 2);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#5eff8f" : "#2f9e5a";
      ctx.fillRect(s.x * cell, s.y * cell, cell - 2, cell - 2);
    });
  }

  function tick() {
    if (!alive) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= size || head.y >= size;
    const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
      alive = false;
      modalStatus.textContent = `Game over — score ${score}. Click PLAY SOLO to try again.`;
      QuadcadeBGM.blip(140, "triangle");
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      modalStatus.textContent = `Score: ${score}`;
      food = spawnFood();
      QuadcadeBGM.blip(920);
      if (score >= 10) {
        alive = false;
        modalStatus.textContent = "You win! +1 coin earned.";
        rewardGameWin("snake");
        return;
      }
    } else {
      snake.pop();
    }
    draw();
  }

  const keyHandler = (e) => {
    const map = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    const next = map[e.key];
    if (!next) return;
    e.preventDefault();
    if (next.x === -dir.x && next.y === -dir.y) return;
    nextDir = next;
  };
  document.addEventListener("keydown", keyHandler);

  modalStatus.textContent = "Score: 0";
  draw();
  const interval = setInterval(tick, 130);
  activeCleanup = () => {
    clearInterval(interval);
    document.removeEventListener("keydown", keyHandler);
  };
}

/* ================= TIC-TAC-TOE ================= */
function startTTT() {
  recordGameStart("ttt");
  openModal("Tic-Tac-Toe");
  modalBody.innerHTML = `<div class="ttt-board" id="ttt-board"></div>
    <p class="muted-note">You're X. The CPU plays O and isn't trying too hard.</p>`;
  const boardEl = document.querySelector("#ttt-board");
  let board = Array(9).fill(null);
  let over = false;

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function winner(b) {
    for (const [a, c, d] of WINS) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(Boolean) ? "draw" : null;
  }

  function cpuMove() {
    const empty = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
    // try to win, then block, then take center/corner, else random
    for (const i of empty) {
      const copy = board.slice(); copy[i] = "O";
      if (winner(copy) === "O") return i;
    }
    for (const i of empty) {
      const copy = board.slice(); copy[i] = "X";
      if (winner(copy) === "X") return i;
    }
    if (board[4] === null) return 4;
    const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function render() {
    boardEl.innerHTML = board
      .map((v, i) => `<div class="ttt-cell" data-cell="${i}">${v || ""}</div>`)
      .join("");
    boardEl.querySelectorAll("[data-cell]").forEach((cellEl) => {
      cellEl.addEventListener("click", () => {
        const i = Number(cellEl.dataset.cell);
        if (over || board[i]) return;
        board[i] = "X";
        QuadcadeBGM.blip(600);
        const w = winner(board);
        if (w) return finish(w);
        const cpu = cpuMove();
        if (cpu !== undefined) board[cpu] = "O";
        const w2 = winner(board);
        render();
        if (w2) finish(w2);
      });
    });
  }

  function finish(w) {
    over = true;
    render();
    if (w === "draw") modalStatus.textContent = "Draw. Play again?";
    else if (w === "X") { modalStatus.textContent = "You win! +1 coin earned."; rewardGameWin("ttt"); QuadcadeBGM.blip(1040); }
    else { modalStatus.textContent = "CPU wins this round."; QuadcadeBGM.blip(160, "triangle"); }
  }

  render();
  activeCleanup = null;
}

/* ================= MEMORY MATCH ================= */
function startMemory() {
  recordGameStart("memory");
  openModal("Memory Match");
  modalBody.innerHTML = `<div class="memory-board" id="memory-board"></div>`;
  const boardEl = document.querySelector("#memory-board");
  const icons = ["★", "◆", "▲", "●", "♥", "♪", "▮", "✦"];
  let deck = [...icons, ...icons]
    .map((icon, i) => ({ icon, id: i, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
  let firstPick = null;
  let lock = false;
  let moves = 0;
  let rewarded = false;

  function render() {
    boardEl.innerHTML = deck
      .map(
        (card) => `
      <div class="memory-cell ${card.flipped ? "flipped" : ""} ${card.matched ? "matched" : ""}" data-id="${card.id}">
        ${card.flipped || card.matched ? card.icon : ""}
      </div>`
      )
      .join("");
    boardEl.querySelectorAll("[data-id]").forEach((cellEl) => {
      cellEl.addEventListener("click", () => onPick(Number(cellEl.dataset.id)));
    });
  }

  function onPick(id) {
    if (lock) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    card.flipped = true;
    QuadcadeBGM.blip(700);
    render();

    if (!firstPick) {
      firstPick = card;
      return;
    }
    moves += 1;
    if (firstPick.icon === card.icon) {
      firstPick.matched = card.matched = true;
      firstPick = null;
      modalStatus.textContent = `Moves: ${moves}`;
      QuadcadeBGM.blip(920);
      if (deck.every((c) => c.matched)) {
        modalStatus.textContent = `Cleared in ${moves} moves! Click PLAY SOLO to reshuffle.`;
        if (!rewarded) {
          rewarded = true;
          modalStatus.textContent = `Cleared in ${moves} moves! +1 coin earned.`;
          rewardGameWin("memory");
        }
      }
      return;
    }
    lock = true;
    modalStatus.textContent = `Moves: ${moves}`;
    setTimeout(() => {
      card.flipped = false;
      firstPick.flipped = false;
      firstPick = null;
      lock = false;
      render();
    }, 650);
  }

  modalStatus.textContent = "Moves: 0";
  render();
  activeCleanup = null;
}

document.querySelectorAll("[data-leaderboard-game]").forEach((button) => {
  button.addEventListener("click", async () => {
    document.querySelectorAll("[data-leaderboard-game]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    leaderboardFilter = button.dataset.leaderboardGame;
    renderGameStats(
      { ...DEFAULT_GAME_STATS, ...((await qGet("game-stats", false)) || {}) },
      (await qGet("leaderboard", true)) || []
    );
  });
});

loadGameStats();

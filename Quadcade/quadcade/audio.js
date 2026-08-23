/* ---------- QUADCADE chiptune BGM ----------
   A tiny procedural 8-bit music engine built on the Web Audio API —
   no audio files needed, just square/triangle oscillators scheduled
   into a looping arpeggio, like a game boot theme. Ships with a
   default track plus a few alternate tracks unlockable in the Store. */

const QuadcadeBGM = (() => {
  let ctx = null;
  let masterGain = null;
  let playing = false;
  let nextNoteTime = 0;
  let stepIndex = 0;
  let schedulerId = null;
  let currentTrackId = "classic";

  const NOTE_FREQ = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0,
    C3: 130.81,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
  };

  // Simple looping chiptune patterns (note names, null = rest)
  const TRACKS = {
    classic: {
      tempo: 132,
      lead: ["C5", "E5", "G5", "E5", "A4", "C5", "E5", "C5", "D5", "F5", "A5", "F5", "G4", "C5", "E5", "G5"],
      bass: ["C3", null, "C3", null, "A2", null, "A2", null, "F2", null, "F2", null, "G2", null, "G2", null],
    },
    "bgm-track-nightdrive": {
      tempo: 94,
      lead: ["A4", null, "C5", null, "E5", null, "D5", null, "A4", null, "G4", null, "E4", null, "G4", null],
      bass: ["A2", null, null, null, "F2", null, null, null, "G2", null, null, null, "E2", null, null, null],
    },
    "bgm-track-arcaderush": {
      tempo: 170,
      lead: ["E5", "G5", "A5", "G5", "E5", "D5", "E5", "G5", "C5", "E5", "G5", "E5", "D5", "C5", "D5", "E5"],
      bass: ["C3", "C3", "G2", "G2", "A2", "A2", "E2", "E2", "F2", "F2", "C3", "C3", "G2", "G2", "G2", "G2"],
    },
    "bgm-track-eightbitdrift": {
      tempo: 106,
      lead: ["G4", null, "A4", null, "C5", null, "A4", null, "F4", null, "G4", null, "E4", null, "D4", null],
      bass: ["G2", null, null, null, "C3", null, null, null, "F2", null, null, null, "D2", null, null, null],
    },
  };

  function track() {
    return TRACKS[currentTrackId] || TRACKS.classic;
  }

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.05;
      masterGain.connect(ctx.destination);
    }
  }

  function pluck(freq, time, dur, type, gainPeak) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainPeak, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function scheduleStep(time, step) {
    const t = track();
    const lead = t.lead[stepIndex % t.lead.length];
    const bass = t.bass[stepIndex % t.bass.length];
    if (lead) pluck(NOTE_FREQ[lead], time, step * 0.9, "square", 0.5);
    if (bass) pluck(NOTE_FREQ[bass], time, step * 1.8, "triangle", 0.7);
    stepIndex += 1;
  }

  function scheduler() {
    const step = 60 / track().tempo / 2; // 8th notes, tempo-aware per track
    while (nextNoteTime < ctx.currentTime + 0.15) {
      scheduleStep(nextNoteTime, step);
      nextNoteTime += step;
    }
    schedulerId = setTimeout(scheduler, 40);
  }

  function start() {
    ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (playing) return;
    playing = true;
    stepIndex = 0;
    nextNoteTime = ctx.currentTime + 0.05;
    scheduler();
  }

  function stop() {
    playing = false;
    clearTimeout(schedulerId);
  }

  function setTrack(id) {
    currentTrackId = TRACKS[id] ? id : "classic";
    stepIndex = 0; // restart the new pattern cleanly from its top
  }

  function getTrack() {
    return currentTrackId;
  }

  function blip(freq = 880, type = "square") {
    ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    pluck(freq, ctx.currentTime, 0.12, type, 0.35);
  }

  function isPlaying() {
    return playing;
  }

  return { start, stop, blip, isPlaying, setTrack, getTrack };
})();

/* Wire up any #bgm-toggle button present on the page, remembering the
   user's mute preference (personal, not shared with other players) and
   their equipped track. BGM defaults to ON for anyone who hasn't set a
   preference yet. */
async function initBGMToggle() {
  const btn = document.querySelector("#bgm-toggle");
  if (!btn) return;

  const savedTrack = await qGet("bgm-track", false);
  QuadcadeBGM.setTrack(savedTrack || "classic");

  const savedPref = await qGet("bgm-on", false);
  const savedOn = savedPref === null ? true : !!savedPref; // default ON

  const setBtnState = (on) => {
    btn.classList.toggle("on", on);
    btn.textContent = on ? "♪" : "♪̸";
    btn.setAttribute("aria-label", on ? "Mute background music" : "Play background music");
  };

  // Autoplay is blocked by browsers until a gesture happens, so we only
  // resume automatically on the first click anywhere if it's meant to be on.
  setBtnState(savedOn);
  let armed = savedOn;
  const armOnce = () => {
    if (armed) {
      QuadcadeBGM.start();
      armed = false;
    }
    document.removeEventListener("click", armOnce);
  };
  if (savedOn) document.addEventListener("click", armOnce);

  btn.addEventListener("click", async () => {
    const on = !QuadcadeBGM.isPlaying();
    if (on) {
      QuadcadeBGM.start();
    } else {
      QuadcadeBGM.stop();
    }
    setBtnState(on);
    await qSet("bgm-on", on, false);
  });
}

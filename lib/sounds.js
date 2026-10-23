// Small interface sounds, synthesized with the Web Audio API so there are no audio files to load.
// Browsers only allow audio after a user gesture, and every cue here is triggered by a click or key.

const STORAGE_KEY = 'finvest_sound';
let ctx = null;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Preference just won't persist.
  }
}

/** One soft note: sine body with a quick attack and exponential decay. */
function note(ac, { freq, start = 0, duration = 0.18, gain = 0.06, type = 'sine' }) {
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

const CUES = {
  // Light tick when an option is selected.
  select: (ac) => {
    note(ac, { freq: 1318.5, duration: 0.09, gain: 0.045, type: 'triangle' });
    note(ac, { freq: 659.3, duration: 0.12, gain: 0.03 });
  },
  // Softer tick when an option is cleared.
  deselect: (ac) => note(ac, { freq: 880, duration: 0.08, gain: 0.03, type: 'triangle' }),
  // Two rising notes when moving to the next step.
  advance: (ac) => {
    note(ac, { freq: 659.3, duration: 0.16 });
    note(ac, { freq: 987.8, start: 0.07, duration: 0.22 });
  },
  // Gentle major arpeggio when setup finishes.
  complete: (ac) => {
    [523.3, 659.3, 784, 1046.5].forEach((freq, i) => note(ac, { freq, start: i * 0.08, duration: 0.5, gain: 0.05 }));
  },
};

export function playCue(name) {
  if (!isSoundEnabled()) return;
  const ac = audio();
  if (ac) CUES[name]?.(ac);
}

/** Tiny WebAudio synthesizer for wooden "clack" sounds and chimes (no audio files needed). */

let ctx: AudioContext | null = null;
let enabled = true;
try {
  enabled = localStorage.getItem('dama-sound') !== 'off';
} catch {
  /* ignore */
}
const listeners = new Set<(on: boolean) => void>();

export const isSoundOn = () => enabled;

export function setSoundOn(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem('dama-sound', on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(on));
}

export function subscribeSound(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function knock(freq: number, dur: number, vol: number, delay = 0) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.02);

  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq / 7, t);
  o.frequency.exponentialRampToValueAtTime(freq / 12, t + dur);
  const og = c.createGain();
  og.gain.setValueAtTime(vol * 0.7, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.2);
  o.connect(og).connect(c.destination);
  o.start(t);
  o.stop(t + dur * 1.3);
}

function tone(freq: number, dur: number, vol: number, delay = 0, type: OscillatorType = 'sine') {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  select: () => knock(2600, 0.04, 0.12),
  move: () => knock(1400, 0.09, 0.55),
  capture: () => {
    knock(2000, 0.07, 0.5);
    knock(800, 0.14, 0.4, 0.045);
  },
  promote: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.4, 0.09, i * 0.075, 'triangle')),
  error: () => tone(150, 0.16, 0.07, 0, 'square'),
  win: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.6, 0.09, i * 0.1, 'triangle')),
  lose: () => [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, 0.5, 0.08, i * 0.14)),
  hint: () => [880, 1174.66].forEach((f, i) => tone(f, 0.25, 0.05, i * 0.08, 'sine')),
};

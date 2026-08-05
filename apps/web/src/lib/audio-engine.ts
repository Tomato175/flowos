'use client';

/**
 * Web Audio API — 心流OS 音效引擎 v3
 * 每个音效听感完全不同，加上自定义音频文件播放
 */

let audioCtx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];
let masterGain: GainNode | null = null;
let intervalIds: ReturnType<typeof setInterval>[] = [];
let customAudioEl: HTMLAudioElement | null = null;
let onEndedCallback: (() => void) | null = null;

export function onTrackEnd(cb: (() => void) | null) { onEndedCallback = cb; }

function ctx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function track(i: ReturnType<typeof setInterval>) { intervalIds.push(i); }

function stopAll() {
  intervalIds.forEach(clearInterval); intervalIds = [];
  activeNodes.forEach((n) => { try { n.disconnect(); } catch {} }); activeNodes = [];
  if (customAudioEl) { customAudioEl.pause(); customAudioEl = null; }
}

export function playAmbient(soundId: string, volume: number) {
  stopAll();
  const c = ctx();
  masterGain = c.createGain();
  masterGain.gain.value = Math.min(volume, 1);

  const isUrl = soundId.startsWith('http://') || soundId.startsWith('https://') || soundId.startsWith('blob:');

  if (isUrl) {
    customAudioEl = new Audio(soundId);
    customAudioEl.loop = false;
    customAudioEl.volume = masterGain.gain.value;
    customAudioEl.preload = 'auto';
    const playPromise = customAudioEl.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn('Audio play failed:', err.message);
      });
    }
    customAudioEl.addEventListener('ended', () => { if (onEndedCallback) onEndedCallback(); });
    customAudioEl.addEventListener('error', () => {
      console.warn('Audio load error:', customAudioEl?.error?.message);
    });
    try {
      const src = c.createMediaElementSource(customAudioEl);
      src.connect(masterGain);
      activeNodes.push(src);
    } catch {}
  } else {
    switch (soundId) {
      case 'rain': rain(c, masterGain); break;
      case 'ocean': ocean(c, masterGain); break;
      case 'fire': fire(c, masterGain); break;
      case 'forest': forest(c, masterGain); break;
      case 'cafe': cafe(c, masterGain); break;
      case 'thunder': thunder(c, masterGain); break;
      case 'windchime': windchime(c, masterGain); break;
      case 'whitenoise': white(c, masterGain); break;
      default: white(c, masterGain);
    }
  }
  masterGain.connect(c.destination);
}

export function setAmbientVolume(v: number) {
  if (masterGain) masterGain.gain.value = Math.min(v, 1);
  if (customAudioEl) customAudioEl.volume = Math.min(v, 1);
}

export function stopAmbient() { stopAll(); }

/* ===== 音效合成（每个听感不同） ===== */

function buf(c: AudioContext, sec: number) {
  const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate);
  return b;
}

function whiteNoise(c: AudioContext, len: number) {
  const b = buf(c, len); const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function pinkNoise(c: AudioContext, len: number) {
  const b = buf(c, len); const d = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    d[i] = (b0 + b1 + b2 + w * 0.5362) * 0.5;
  }
  return b;
}

function brownNoise(c: AudioContext, len: number) {
  const b = buf(c, len); const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last += (Math.random() * 2 - 1) * 0.02;
    if (last > 1) last = 1; if (last < -1) last = -1;
    d[i] = last * 0.7;
  }
  return b;
}

function loopNode(c: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const s = c.createBufferSource(); s.buffer = buffer; s.loop = true; s.start(); activeNodes.push(s); return s;
}

/* === 白噪音 === */
function white(c: AudioContext, g: GainNode) {
  const src = loopNode(c, whiteNoise(c, 3));
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
  src.connect(lp); lp.connect(g);
  activeNodes.push(lp);
  g.gain.value = 0.15;
}

/* === 雨声：粉噪高频 + 密集雨滴 === */
function rain(c: AudioContext, g: GainNode) {
  const src = loopNode(c, pinkNoise(c, 3));
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
  src.connect(hp);
  const rainGain = c.createGain(); rainGain.gain.value = 0.08;
  hp.connect(rainGain); rainGain.connect(g);
  activeNodes.push(hp, rainGain);

  // 密集雨滴掉落
  g.gain.value = 0.6;
  const drop = () => {
    if (!masterGain) return;
    const osc = c.createOscillator(); osc.type = 'sine';
    osc.frequency.value = 300 + Math.random() * 400;
    const eg = c.createGain();
    eg.gain.setValueAtTime(0.04 * Math.random(), c.currentTime);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06 + Math.random() * 0.08);
    osc.connect(eg); eg.connect(g);
    osc.start(); osc.stop(c.currentTime + 0.12);
  };
  for (let i = 0; i < 30; i++) setTimeout(drop, i * 60);
  track(setInterval(drop, 30));
}

/* === 海浪：棕色噪 LFO 调制 === */
function ocean(c: AudioContext, g: GainNode) {
  const src = loopNode(c, brownNoise(c, 4));
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  src.connect(lp);
  const lfo = c.createOscillator(); lfo.frequency.value = 0.06;
  const lfoG = c.createGain(); lfoG.gain.value = 0.15;
  lfo.connect(lfoG);
  const waveGain = c.createGain(); waveGain.gain.value = 0.3;
  lp.connect(waveGain);
  lfoG.connect(waveGain.gain);
  waveGain.connect(g);
  lfo.start();
  activeNodes.push(lp, lfo, lfoG, waveGain);
  g.gain.value = 1.0;
}

/* === 篝火：白噪低频爆裂 === */
function fire(c: AudioContext, g: GainNode) {
  const src = loopNode(c, whiteNoise(c, 3));
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
  src.connect(lp);
  const fg = c.createGain(); fg.gain.value = 0.04;
  lp.connect(fg); fg.connect(g);
  activeNodes.push(lp, fg);
  g.gain.value = 0.8;

  const crack = () => {
    if (!masterGain) return;
    const s = c.createBufferSource(); s.buffer = whiteNoise(c, 0.15);
    const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 500 + Math.random() * 500;
    s.connect(lp2);
    const eg = c.createGain();
    eg.gain.setValueAtTime(0, c.currentTime);
    eg.gain.linearRampToValueAtTime(0.25 * Math.random(), c.currentTime + 0.02);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    lp2.connect(eg); eg.connect(g); s.start();
  };
  track(setInterval(crack, 250 + Math.random() * 200));
}

/* === 林间：带通粉噪 + 啾啾鸟鸣 === */
function forest(c: AudioContext, g: GainNode) {
  const src = loopNode(c, pinkNoise(c, 3));
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 0.4;
  src.connect(bp);
  const fg = c.createGain(); fg.gain.value = 0.03;
  bp.connect(fg); fg.connect(g);
  activeNodes.push(bp, fg);
  g.gain.value = 0.7;

  const chirp = () => {
    if (!masterGain) return;
    const osc = c.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(1500 + Math.random() * 1000, c.currentTime);
    osc.frequency.linearRampToValueAtTime(2500 + Math.random() * 1500, c.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(1200 + Math.random() * 800, c.currentTime + 0.16);
    const eg = c.createGain();
    eg.gain.setValueAtTime(0, c.currentTime);
    eg.gain.linearRampToValueAtTime(0.02, c.currentTime + 0.02);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.connect(eg); eg.connect(g);
    osc.start(); osc.stop(c.currentTime + 0.2);
  };
  track(setInterval(chirp, 2000 + Math.random() * 2000));
}

/* === 咖啡馆：多层白噪 + 低频嗡鸣 === */
function cafe(c: AudioContext, g: GainNode) {
  const src1 = loopNode(c, pinkNoise(c, 3));
  const bp1 = c.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 500; bp1.Q.value = 1.0;
  src1.connect(bp1);
  const g1 = c.createGain(); g1.gain.value = 0.03; bp1.connect(g1); g1.connect(g);
  const src2 = loopNode(c, whiteNoise(c, 3));
  const bp2 = c.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1500; bp2.Q.value = 0.6;
  src2.connect(bp2);
  const g2 = c.createGain(); g2.gain.value = 0.02; bp2.connect(g2); g2.connect(g);
  activeNodes.push(bp1, g1, bp2, g2);
  g.gain.value = 0.6;

  const rattle = () => {
    if (!masterGain) return;
    const osc = c.createOscillator(); osc.type = 'triangle';
    osc.frequency.value = 2500 + Math.random() * 2500;
    const eg = c.createGain();
    eg.gain.setValueAtTime(0, c.currentTime);
    eg.gain.linearRampToValueAtTime(0.015, c.currentTime + 0.01);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    osc.connect(eg); eg.connect(g);
    osc.start(); osc.stop(c.currentTime + 0.08);
  };
  track(setInterval(rattle, 3000 + Math.random() * 3000));
}

/* === 雷雨：雨声 + 低频滚雷 === */
function thunder(c: AudioContext, g: GainNode) {
  rain(c, g);
  g.gain.value = 0.6;
  track(setInterval(() => {
    if (!masterGain) return;
    const s = c.createBufferSource(); s.buffer = brownNoise(c, 2);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 80;
    s.connect(lp);
    const eg = c.createGain();
    eg.gain.setValueAtTime(0, c.currentTime);
    eg.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.3);
    eg.gain.linearRampToValueAtTime(0.3, c.currentTime + 1.0);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.5);
    lp.connect(eg); eg.connect(g); s.start();
  }, 8000 + Math.random() * 10000));
}

/* === 风铃：高频正弦随机序列 === */
function windchime(c: AudioContext, g: GainNode) {
  const freqs = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];
  track(setInterval(() => {
    if (!masterGain) return;
    const f = freqs[Math.floor(Math.random() * freqs.length)]!;
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const eg = c.createGain();
    eg.gain.setValueAtTime(0, c.currentTime);
    eg.gain.linearRampToValueAtTime(0.02, c.currentTime + 0.04);
    eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
    osc.connect(eg); eg.connect(g);
    osc.start(); osc.stop(c.currentTime + 1.3);
  }, 600 + Math.random() * 800));
  g.gain.value = 0.5;
}

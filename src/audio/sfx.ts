// Efeitos sonoros sintetizados com Web Audio (sem arquivos de áudio).
//
// No iPad, o áudio só pode começar depois de um toque; ele também pode ser
// interrompido quando o app vai para o segundo plano. Por isso o contexto é
// criado no primeiro toque, liberado de novo a cada toque e recriado se não
// voltar sozinho.

import { store } from '../storage.ts';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function create(): void {
  ctx = new AudioContext();
  const compressor = ctx.createDynamicsCompressor();
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(compressor).connect(ctx.destination);
}

let speechReady = false;

/** No iOS a voz só funciona depois de ser usada uma vez dentro de um toque completo. */
function unlockSpeech(): void {
  if (speechReady || !('speechSynthesis' in window)) return;
  speechReady = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    // sem voz
  }
}

function unlock(): void {
  try {
    if (!ctx) create();
    if (ctx && ctx.state !== 'running') {
      void ctx.resume().catch(() => {});
      // Um som mudo dentro do toque "destrava" o áudio no iOS.
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    // sem áudio neste aparelho
  }
}

export function initAudio(): void {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    // não suportado
  }
  for (const ev of ['pointerdown', 'pointerup', 'touchend']) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  }
  for (const ev of ['touchend', 'click']) {
    window.addEventListener(ev, unlockSpeech, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !ctx) return;
    void ctx.resume().catch(() => {});
    setTimeout(() => {
      if (ctx && ctx.state !== 'running') {
        void ctx.close().catch(() => {});
        ctx = null;
        master = null;
      }
    }, 400);
  });
}

function out(): { ac: AudioContext; dest: GainNode } | null {
  if (!store.sound || !ctx || !master || ctx.state !== 'running') return null;
  return { ac: ctx, dest: master };
}

function tone(
  type: OscillatorType,
  freq: number,
  at: number,
  dur: number,
  peak: number,
  freqEnd?: number,
  dest?: AudioNode,
): void {
  const o = out();
  if (!o) return;
  const t = o.ac.currentTime + at;
  const osc = o.ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  const g = o.ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(dest ?? o.dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Voz em português do aparelho (se tiver). */
function ptVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'pt-BR') ?? voices.find((v) => v.lang.startsWith('pt'));
}

export const sfx = {
  /** Notinha enquanto pinta (a escala sobe ao longo da letra). */
  twinkle(freq: number): void {
    tone('sine', freq, 0, 0.2, 0.16);
    tone('triangle', freq * 2, 0, 0.1, 0.04);
  },
  /** Fim de um traço: "plim" subindo. */
  strokeDone(): void {
    [1046.5, 1318.51, 1567.98].forEach((f, i) => tone('triangle', f, i * 0.06, 0.18, 0.18));
  },
  /** Dedo saiu do caminho: "hum" baixinho. */
  oops(): void {
    tone('sine', 330, 0, 0.16, 0.16, 250);
  },
  /** O lápis pula chamando o dedo. */
  hop(): void {
    tone('sine', 420, 0, 0.12, 0.2, 840);
  },
  /** Recomeçar: som "de volta". */
  undo(): void {
    tone('sine', 700, 0, 0.18, 0.3, 300);
  },
  /** Toque em botão. */
  pop(): void {
    tone('sine', 500, 0, 0.1, 0.35, 900);
  },
  /** Festa: letra completa. */
  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone('triangle', f, i * 0.11, 0.22, 0.3));
    for (const f of [523.25, 659.25, 783.99]) tone('triangle', f, 0.5, 0.8, 0.22);
    [1568, 2093, 1760, 2637].forEach((f, i) => tone('sine', f, 0.55 + i * 0.09, 0.12, 0.08));
  },
  /** Fala uma palavra (nome da letra) com a voz do iPad. */
  say(text: string): void {
    if (!store.sound || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      const voice = ptVoice();
      if (voice) u.voice = voice;
      u.rate = 0.85;
      u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch {
      // sem voz
    }
  },
};

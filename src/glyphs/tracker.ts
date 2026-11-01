// Segue o dedo ao longo dos traços da letra.
//
// O lápis só anda para a frente e só quando o dedo está perto do caminho.
// Ele avança pelo caminho enquanto o caminho continua perto do dedo; assim
// não dá para "pular" partes, cortar pontas (V, W) nem atalhar laços (O, 8).

import type { Pt } from './geometry.ts';

export interface TrackerOptions {
  /** Distância máxima do dedo até o caminho (fora disso o lápis para). */
  readonly tolerance: number;
  /** Quanto à frente do lápis o dedo pode estar. */
  readonly window: number;
  /** Folga no fim do traço para considerá-lo completo. */
  readonly endSlack: number;
  /** O dedo pode recomeçar até esta distância à frente do lápis. */
  readonly start: number;
}

export const DEFAULT_OPTIONS: TrackerOptions = { tolerance: 11, window: 20, endSlack: 2, start: 6 };

/**
 * off: dedo longe do caminho; hold: perto, mas não andou;
 * advance: andou; stroke: terminou um traço; done: terminou a letra.
 */
export type FeedResult = 'off' | 'hold' | 'advance' | 'stroke' | 'done';

export class Tracker {
  readonly strokes: readonly (readonly Pt[])[];
  readonly step: number;
  readonly options: TrackerOptions;
  /** Traço atual (igual a strokes.length quando a letra acabou). */
  stroke = 0;
  /** Posição do lápis no traço atual (índice do ponto). */
  index = 0;

  constructor(strokes: readonly (readonly Pt[])[], step = 1, options: TrackerOptions = DEFAULT_OPTIONS) {
    this.strokes = strokes;
    this.step = step;
    this.options = options;
  }

  get done(): boolean {
    return this.stroke >= this.strokes.length;
  }

  /** Onde está a ponta do lápis. */
  get point(): Pt {
    if (this.done) {
      const last = this.strokes[this.strokes.length - 1];
      return last[last.length - 1];
    }
    return this.strokes[this.stroke][this.index];
  }

  reset(): void {
    this.stroke = 0;
    this.index = 0;
  }

  /** Dedo em (x, y). */
  feed(x: number, y: number): FeedResult {
    if (this.done) return 'done';
    const pts = this.strokes[this.stroke];
    const last = pts.length - 1;
    const tol = this.options.tolerance;
    const d = (j: number) => Math.hypot(x - pts[j][0], y - pts[j][1]);
    // O dedo precisa estar perto do lápis (ou um tiquinho à frente dele)...
    const near = Math.min(last, this.index + Math.round(this.options.start / this.step));
    let j = this.index;
    while (j <= near && d(j) > tol) j++;
    if (j > near) return 'off';
    // ...e o lápis anda pelo caminho enquanto ele continua perto do dedo,
    // parando no ponto mais próximo. Assim não pula por cima de pontas e laços.
    const ahead = Math.min(last, this.index + Math.round(this.options.window / this.step));
    let best = j;
    let bestD = d(j);
    for (let k = j + 1; k <= ahead; k++) {
      const dk = d(k);
      if (dk > tol) break;
      // Em empate fica com o primeiro: nunca adianta à toa.
      if (dk < bestD - 1e-9) {
        best = k;
        bestD = dk;
      }
    }
    if (best <= this.index) return 'hold';
    this.index = best;
    const end = pts.length - 1 - Math.round(this.options.endSlack / this.step);
    if (this.index >= end) {
      this.stroke++;
      this.index = 0;
      return this.done ? 'done' : 'stroke';
    }
    return 'advance';
  }
}

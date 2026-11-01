// Letras maiúsculas (letra de forma) e números, traço a traço, na ordem em
// que se ensina a escrever. Quadrado de 100 x 100; a letra vai de y=12 a y=88.

import { arc, cubic, join, line, resample, type Pt } from './geometry.ts';

export interface Glyph {
  /** O caractere ("A", "7"). */
  readonly id: string;
  /** Como se fala (para a voz). */
  readonly say: string;
  /** Traços com pontos a cada STEP unidades, na ordem de escrever. */
  readonly strokes: readonly (readonly Pt[])[];
}

/** Distância entre os pontos de cada traço. */
export const STEP = 1;

const T = 12; // topo
const B = 88; // base
const M = 50; // meio

// Formas que se repetem.
const ovalCCW = (cx: number, rx: number) => arc(cx, M, rx, 38, -90, -450 + 6); // começa em cima, vai pela esquerda

const RAW: Record<string, { say: string; strokes: Pt[][] }> = {
  A: { say: 'A', strokes: [line([50, T], [22, B]), line([50, T], [78, B]), line([32, 62], [68, 62])] },
  B: {
    say: 'Bê',
    strokes: [
      line([28, T], [28, B]),
      join(line([28, T], [54, T]), arc(54, 30.5, 18, 18.5, -90, 90), line([54, 49], [28, 49])),
      join(line([28, 49], [57, 49]), arc(57, 68.5, 20, 19.5, -90, 90), line([57, B], [28, B])),
    ],
  },
  C: { say: 'Cê', strokes: [arc(54, M, 30, 38, -40, -320)] },
  D: {
    say: 'Dê',
    strokes: [line([26, T], [26, B]), join(line([26, T], [44, T]), arc(44, M, 32, 38, -90, 90), line([44, B], [26, B]))],
  },
  E: {
    say: 'É',
    strokes: [line([28, T], [28, B]), line([28, T], [72, T]), line([28, M], [64, M]), line([28, B], [72, B])],
  },
  F: { say: 'Éfe', strokes: [line([30, T], [30, B]), line([30, T], [72, T]), line([30, M], [64, M])] },
  G: { say: 'Gê', strokes: [join(arc(54, M, 30, 38, -40, -360), line([84, M], [62, M]))] },
  H: { say: 'Agá', strokes: [line([26, T], [26, B]), line([74, T], [74, B]), line([26, M], [74, M])] },
  I: { say: 'I', strokes: [line([50, T], [50, B])] },
  J: { say: 'Jota', strokes: [join(line([64, T], [64, 66]), arc(46, 66, 18, 22, 0, 180))] },
  K: { say: 'Cá', strokes: [line([30, T], [30, B]), line([72, T], [32, M], [74, B])] },
  L: { say: 'Éle', strokes: [line([30, T], [30, B], [72, B])] },
  M: {
    say: 'Ême',
    strokes: [line([22, T], [22, B]), line([22, T], [50, 62], [78, T]), line([78, T], [78, B])],
  },
  N: { say: 'Êne', strokes: [line([26, T], [26, B]), line([26, T], [74, B], [74, T])] },
  O: { say: 'Ó', strokes: [ovalCCW(50, 30)] },
  P: {
    say: 'Pê',
    strokes: [line([28, T], [28, B]), join(line([28, T], [52, T]), arc(52, 32, 20, 20, -90, 90), line([52, 52], [28, 52]))],
  },
  Q: { say: 'Quê', strokes: [ovalCCW(50, 30), line([58, 66], [80, 90])] },
  R: {
    say: 'Érre',
    strokes: [
      line([28, T], [28, B]),
      join(line([28, T], [52, T]), arc(52, 32, 20, 20, -90, 90), line([52, 52], [28, 52])),
      line([42, 52], [74, B]),
    ],
  },
  S: { say: 'Ésse', strokes: [join(arc(50, 31, 22, 19, -20, -270), arc(50, 69, 24, 19, -90, 160))] },
  T: { say: 'Tê', strokes: [line([20, T], [80, T]), line([50, T], [50, B])] },
  U: { say: 'U', strokes: [join(line([26, T], [26, 62]), arc(50, 62, 24, 26, 180, 0), line([74, 62], [74, T]))] },
  V: { say: 'Vê', strokes: [line([22, T], [50, B], [78, T])] },
  W: { say: 'Dáblio', strokes: [line([14, T], [30, B], [50, 36], [70, B], [86, T])] },
  X: { say: 'Xis', strokes: [line([24, T], [76, B]), line([76, T], [24, B])] },
  Y: { say: 'Ípsilon', strokes: [line([24, T], [50, 48]), line([76, T], [50, 48], [50, B])] },
  Z: { say: 'Zê', strokes: [line([24, T], [76, T], [24, B], [76, B])] },

  '0': { say: 'Zero', strokes: [ovalCCW(50, 26)] },
  '1': { say: 'Um', strokes: [line([36, 28], [56, T], [56, B])] },
  '2': { say: 'Dois', strokes: [join(arc(50, 34, 22, 22, 200, 400), line([66.9, 48.1], [26, B], [76, B]))] },
  '3': { say: 'Três', strokes: [join(arc(48, 31, 22, 19, 200, 450), arc(48, 69, 24, 19, 270, 520))] },
  '4': { say: 'Quatro', strokes: [line([58, T], [22, 64], [80, 64]), line([62, T], [62, B])] },
  '5': { say: 'Cinco', strokes: [join(line([70, T], [32, T], [33.6, 45.6]), arc(49, 64, 24, 24, 230, 520))] },
  '6': { say: 'Seis', strokes: [join(cubic([68, 16], [44, 10], [28, 36], [28, 66]), arc(50, 66, 22, 22, 180, -170))] },
  '7': { say: 'Sete', strokes: [line([22, T], [78, T], [40, B])] },
  '8': {
    say: 'Oito',
    strokes: [join(arc(50, 31, 18, 19, -90, -270), arc(50, 69, 22, 19, -90, 270), arc(50, 31, 18, 19, 90, -90))],
  },
  '9': { say: 'Nove', strokes: [arc(48, 34, 22, 22, -10, -360 + 4), line([70, 34], [70, B])] },
};

/** Ordem do mapa: A a Z e depois 0 a 9 (36 casas). */
export const ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

export const GLYPHS: readonly Glyph[] = ORDER.map((id) => ({
  id,
  say: RAW[id].say,
  strokes: RAW[id].strokes.map((s) => resample(s, STEP)),
}));

export function glyphById(id: string): Glyph {
  return GLYPHS.find((g) => g.id === id) ?? GLYPHS[0];
}

/** Grupo do mapa: 0 = A a M, 1 = N a Z, 2 = números. */
export function groupOf(id: string): number {
  if (/[0-9]/.test(id)) return 2;
  return id <= 'M' ? 0 : 1;
}

/** O nome dele, letra por letra. */
export const NAME = 'GUSTAVO';

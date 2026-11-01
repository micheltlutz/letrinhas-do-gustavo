// Letras de forma (maiúsculas e minúsculas) e números, traço a traço, na
// ordem em que se ensina a escrever. Quadrado de 100 x 100.
// Maiúsculas e números vão de y=12 a y=88. Minúsculas seguem as linhas do
// caderno: altas sobem até y=10, o corpo vai de y=40 a y=78 e as que descem
// (g, j, p, q, y) vão até y=92.

import { arc, cubic, join, line, resample, type Pt } from './geometry.ts';

export interface Glyph {
  /** O caractere ("A", "a", "7"). */
  readonly id: string;
  /** Como se fala (para a voz). */
  readonly say: string;
  /** Minúscula (usa as linhas do caderno de minúsculas). */
  readonly lower: boolean;
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

// ---------- minúsculas ----------

const ASC = 10; // topo das letras altas (b, d, h...)
const XH = 40; // topo do corpo da letra
const BASE = 78; // linha de base
const DESC = 92; // fim das que descem (g, p...)
const XM = 59; // meio do corpo

/** Bolinha das minúsculas (a, d, g, q): começa em cima à direita e gira pela esquerda. */
const bowlCCW = (cx: number) => arc(cx, XM, 16, 19, -30, -380);
/** Barriga do b e do p: sai da haste e gira pela direita. */
const bowlCW = (cx: number) => arc(cx, XM, 16, 19, 180, 540);
/** Pingo do i e do j (um tracinho curto: basta tocar). */
const dot = (x: number) => line([x, 22], [x, 24.5]);

const RAW_LOWER: Record<string, Pt[][]> = {
  a: [bowlCCW(48), line([64, XH], [64, BASE])],
  b: [line([34, ASC], [34, BASE]), bowlCW(50)],
  c: [arc(52, XM, 16, 19, -40, -320)],
  d: [bowlCCW(48), line([64, ASC], [64, BASE])],
  e: [join(line([32, XM], [64, XM]), arc(48, XM, 16, 19, 0, -315))],
  f: [join(arc(56, 22, 12, 12, -30, -180), line([44, 22], [44, BASE])), line([32, XH], [60, XH])],
  g: [bowlCCW(48), join(line([64, XH], [64, 82]), arc(50, 82, 14, 10, 0, 165))],
  h: [line([34, ASC], [34, BASE]), join(arc(49, 56, 15, 16, 180, 360), line([64, 56], [64, BASE]))],
  i: [line([50, XH], [50, BASE]), dot(50)],
  j: [join(line([56, XH], [56, 82]), arc(44, 82, 12, 10, 0, 160)), dot(56)],
  k: [line([34, ASC], [34, BASE]), line([62, XH], [36, 62], [64, BASE])],
  l: [line([50, ASC], [50, BASE])],
  m: [
    line([20, XH], [20, BASE]),
    join(arc(34, 53, 14, 13, 180, 360), line([48, 53], [48, BASE])),
    join(arc(62, 53, 14, 13, 180, 360), line([76, 53], [76, BASE])),
  ],
  n: [line([30, XH], [30, BASE]), join(arc(46, 55, 16, 15, 180, 360), line([62, 55], [62, BASE]))],
  o: [arc(50, XM, 17, 19, -90, -444)],
  p: [line([34, XH], [34, DESC]), bowlCW(50)],
  q: [bowlCCW(48), line([64, XH], [64, DESC])],
  r: [line([36, XH], [36, BASE]), arc(50, 54, 14, 13, 180, 320)],
  s: [join(arc(50, 49.5, 14, 9.5, -20, -270), arc(50, 68.5, 15, 9.5, -90, 160))],
  t: [join(line([46, 16], [46, 70]), arc(54, 70, 8, 8, 180, 30)), line([34, XH], [60, XH])],
  u: [join(line([32, XH], [32, 62]), arc(47, 62, 15, 16, 180, 0), line([62, 62], [62, XH])), line([62, XH], [62, BASE])],
  v: [line([28, XH], [50, BASE], [72, XH])],
  w: [line([18, XH], [31, BASE], [50, 52], [69, BASE], [82, XH])],
  x: [line([30, XH], [70, BASE]), line([70, XH], [30, BASE])],
  y: [line([30, XH], [48, 74]), line([70, XH], [36, DESC])],
  z: [line([32, XH], [68, XH], [32, BASE], [68, BASE])],
};

export type LetterCase = 'upper' | 'lower';

/** Linhas da folha: [y, tipo]. Maiúsculas/números: topo, meio e base. Minúsculas: as do caderno. */
export const GUIDES: Record<LetterCase, readonly (readonly [number, 'solid' | 'mid' | 'low'])[]> = {
  upper: [
    [12, 'solid'],
    [50, 'mid'],
    [88, 'solid'],
  ],
  lower: [
    [ASC, 'solid'],
    [XH, 'mid'],
    [BASE, 'solid'],
    [DESC, 'low'],
  ],
};

const DIGITS = '0123456789';

/** Ordem do mapa (36 casas): as letras do tipo escolhido e depois 0 a 9. */
export const ORDERS: Record<LetterCase, readonly string[]> = {
  upper: ('ABCDEFGHIJKLMNOPQRSTUVWXYZ' + DIGITS).split(''),
  lower: ('abcdefghijklmnopqrstuvwxyz' + DIGITS).split(''),
};

/** O nome dele: tudo maiúsculo ou como se escreve um nome. */
export const NAMES: Record<LetterCase, string> = { upper: 'GUSTAVO', lower: 'Gustavo' };

function build(id: string, say: string, strokes: Pt[][], lower: boolean): Glyph {
  return { id, say, lower, strokes: strokes.map((s) => resample(s, STEP)) };
}

/** Todas: A a Z, a a z e 0 a 9. */
export const GLYPHS: readonly Glyph[] = [
  ...ORDERS.upper.map((id) => build(id, RAW[id].say, RAW[id].strokes, false)),
  ...Object.entries(RAW_LOWER).map(([id, strokes]) => build(id, RAW[id.toUpperCase()].say, strokes, true)),
];

export function glyphById(id: string): Glyph {
  return GLYPHS.find((g) => g.id === id) ?? GLYPHS[0];
}

/** Grupo do mapa: 0 = A a M, 1 = N a Z, 2 = números. */
export function groupOf(id: string): number {
  if (DIGITS.includes(id)) return 2;
  return id.toUpperCase() <= 'M' ? 0 : 1;
}

export { isDot } from './geometry.ts';

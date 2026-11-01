import { describe, expect, it } from 'vitest';
import { dist, lengthOf, type Pt } from '../src/glyphs/geometry.ts';
import { GLYPHS, NAMES, ORDERS, STEP, glyphById, groupOf, isDot } from '../src/glyphs/glyphs.ts';
import { DEFAULT_OPTIONS, Tracker } from '../src/glyphs/tracker.ts';

/** Dedo de criança: segue o traço tremendo para os lados. */
function wobblyFinger(stroke: readonly Pt[], amount: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < stroke.length; i++) {
    const a = stroke[Math.max(0, i - 1)];
    const b = stroke[Math.min(stroke.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const off = Math.sin(i * 0.7) * amount;
    out.push([stroke[i][0] + nx * off, stroke[i][1] + ny * off]);
  }
  return out;
}

describe('letras e números', () => {
  it('são 62: A a Z, a a z e 0 a 9; cada mapa tem 36 casas', () => {
    expect(GLYPHS).toHaveLength(62);
    expect(new Set(GLYPHS.map((g) => g.id)).size).toBe(62);
    for (const order of Object.values(ORDERS)) {
      expect(order).toHaveLength(36);
      for (const id of order) expect(glyphById(id).id).toBe(id);
    }
    expect(GLYPHS.filter((g) => g.lower).map((g) => g.id).join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(groupOf('A')).toBe(0);
    expect(groupOf('m')).toBe(0);
    expect(groupOf('N')).toBe(1);
    expect(groupOf('z')).toBe(1);
    expect(groupOf('7')).toBe(2);
  });

  it('minúscula fala o mesmo nome da maiúscula', () => {
    expect(glyphById('h').say).toBe(glyphById('H').say);
  });

  it('o nome dele só usa letras que existem', () => {
    expect(NAMES.upper).toBe('GUSTAVO');
    expect(NAMES.lower).toBe('Gustavo');
    for (const name of Object.values(NAMES)) for (const c of name) expect(glyphById(c).id).toBe(c);
  });

  it('só o i e o j têm pingo', () => {
    const withDot = GLYPHS.filter((g) => g.strokes.some(isDot)).map((g) => g.id);
    expect(withDot).toEqual(['i', 'j']);
  });

  it.each(GLYPHS.map((g) => [g.id, g] as const))('%s: traços dentro da folha e com tamanho bom', (_, g) => {
    expect(g.strokes.length).toBeGreaterThan(0);
    expect(g.say.length).toBeGreaterThan(0);
    for (const s of g.strokes) {
      if (!isDot(s)) expect(lengthOf(s)).toBeGreaterThan(15);
      for (const [x, y] of s) {
        expect(x).toBeGreaterThanOrEqual(8);
        expect(x).toBeLessThanOrEqual(92);
        expect(y).toBeGreaterThanOrEqual(8);
        expect(y).toBeLessThanOrEqual(92.5);
      }
      // espaçamento igual (o lápis anda de passo em passo)
      for (let i = 1; i < s.length; i++) expect(dist(s[i - 1], s[i])).toBeLessThanOrEqual(STEP + 1e-6);
    }
  });

  it.each(GLYPHS.map((g) => [g.id, g] as const))('%s: com o dedo certinho, o lápis acompanha sem pular', (_, g) => {
    const t = new Tracker(g.strokes, STEP);
    for (const stroke of g.strokes) {
      const s = t.stroke;
      wobblyFinger(stroke, DEFAULT_OPTIONS.tolerance * 0.15).forEach(([x, y], i) => {
        t.feed(x, y);
        // só nas pontas o lápis pode adiantar um pouquinho
        if (t.stroke === s) expect(t.index - i).toBeLessThanOrEqual(9 / STEP);
      });
      expect(t.stroke).toBe(s + 1);
    }
    expect(t.done).toBe(true);
  });

  it.each(GLYPHS.map((g) => [g.id, g] as const))('%s: dá para terminar com o dedo tremendo bastante', (_, g) => {
    const t = new Tracker(g.strokes, STEP);
    for (const stroke of g.strokes) {
      const s = t.stroke;
      for (const [x, y] of wobblyFinger(stroke, DEFAULT_OPTIONS.tolerance * 0.85)) {
        const r = t.feed(x, y);
        // o lápis nunca vai para longe do dedo
        if (r === 'advance') expect(Math.hypot(t.point[0] - x, t.point[1] - y)).toBeLessThanOrEqual(DEFAULT_OPTIONS.tolerance);
      }
      expect(t.stroke).toBe(s + 1);
    }
    expect(t.done).toBe(true);
  });

  it.each(GLYPHS.map((g) => [g.id, g] as const))('%s: correr o dedo de qualquer jeito longe do caminho não completa', (_, g) => {
    const t = new Tracker(g.strokes, STEP);
    for (let k = 0; k < 400; k++) t.feed(5 + ((k * 37) % 90), -25);
    expect(t.stroke).toBe(0);
  });
});

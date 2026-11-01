import { describe, expect, it } from 'vitest';
import { line, resample, type Pt } from '../src/glyphs/geometry.ts';
import { Tracker } from '../src/glyphs/tracker.ts';

const straight = resample(line([10, 50], [90, 50]), 1);

describe('seguidor do dedo', () => {
  it('anda junto com o dedo em cima do caminho', () => {
    const t = new Tracker([straight]);
    expect(t.feed(10, 50)).toBe('hold');
    expect(t.feed(15, 52)).toBe('advance');
    expect(t.point[0]).toBeCloseTo(15);
  });

  it('para quando o dedo sai do caminho e volta a andar quando ele volta', () => {
    const t = new Tracker([straight]);
    t.feed(10, 50);
    t.feed(20, 50);
    const at = t.point[0];
    expect(t.feed(25, 80)).toBe('off');
    expect(t.point[0]).toBe(at);
    expect(t.feed(24, 51)).toBe('advance');
  });

  it('não deixa pular para longe na frente', () => {
    const t = new Tracker([straight]);
    expect(t.feed(70, 50)).toBe('off');
    expect(t.index).toBe(0);
  });

  it('não corta a ponta de um V', () => {
    const v = resample(line([20, 10], [50, 90], [80, 10]), 1);
    const t = new Tracker([v]);
    for (let y = 10; y <= 70; y += 2) t.feed(20 + ((y - 10) * 30) / 80, y);
    const before = t.index;
    // dedo do lado de dentro do V, já perto da outra perna
    t.feed(52, 72);
    expect(t.index - before).toBeLessThan(12);
  });

  it('cada traço só começa com o dedo perto do começo dele', () => {
    const stem = resample(line([64, 40], [64, 78]), 1);
    const t = new Tracker([straight, stem]);
    for (let x = 10; x <= 90 && t.stroke === 0; x += 2) t.feed(x, 50);
    // dedo parado perto do meio da perninha: o lápis espera no começo dela
    expect(t.feed(63, 52)).toBe('off');
    expect(t.index).toBe(0);
    expect(t.feed(64, 41)).toBe('advance');
  });

  it('o primeiro toque precisa ser perto do lápis', () => {
    const t = new Tracker([straight]);
    expect(t.feed(25, 50)).toBe('off');
    expect(t.feed(13, 50)).toBe('advance');
  });

  it('pingo (traço curtinho) completa com um toque, em qualquer parte dele', () => {
    const dot = resample(line([50, 22], [50, 24.5]), 1);
    expect(new Tracker([dot]).feed(50, 23.6)).toBe('done');
    expect(new Tracker([dot]).feed(52, 21)).toBe('done');
    expect(new Tracker([dot]).feed(50, 45)).toBe('off');
  });

  it('não volta para trás', () => {
    const t = new Tracker([straight]);
    t.feed(10, 50);
    t.feed(25, 50);
    const at = t.index;
    expect(t.feed(20, 50)).toBe('hold');
    expect(t.index).toBe(at);
  });

  it('termina um traço e passa para o próximo; depois a letra', () => {
    const second = resample(line([50, 10], [50, 90]), 1);
    const t = new Tracker([straight, second]);
    let r = '';
    for (let x = 10; x <= 90 && r !== 'stroke'; x += 2) r = t.feed(x, 50);
    expect(r).toBe('stroke');
    expect(t.stroke).toBe(1);
    expect(t.point).toEqual([50, 10]);
    for (let y = 10; y <= 90 && r !== 'done'; y += 2) r = t.feed(50, y);
    expect(r).toBe('done');
    expect(t.done).toBe(true);
  });

  it('numa letra fechada, o fim (que encosta no começo) não conta no início', () => {
    const ring: Pt[] = resample(
      Array.from({ length: 181 }, (_, i) => {
        const a = (-90 - i * 2) * (Math.PI / 180);
        return [50 + 30 * Math.cos(a), 50 + 30 * Math.sin(a)] as Pt;
      }),
      1,
    );
    const t = new Tracker([ring]);
    const end = ring[ring.length - 1];
    expect(t.feed(end[0], end[1])).toBe('hold');
    expect(t.index).toBe(0);
  });
});

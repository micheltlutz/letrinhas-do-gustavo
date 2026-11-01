import { describe, expect, it } from 'vitest';
import { arc, cumulative, dist, join, lengthOf, line, resample } from '../src/glyphs/geometry.ts';

describe('geometria', () => {
  it('arco começa e termina nos ângulos certos (y para baixo)', () => {
    const a = arc(50, 50, 10, 10, -90, 90);
    expect(a[0][0]).toBeCloseTo(50);
    expect(a[0][1]).toBeCloseTo(40); // em cima
    expect(a[a.length - 1][1]).toBeCloseTo(60); // embaixo
    // passando pela direita (sentido horário)
    expect(Math.max(...a.map((p) => p[0]))).toBeCloseTo(60);
  });

  it('junta partes sem repetir o ponto da emenda', () => {
    expect(join(line([0, 0], [10, 0]), line([10, 0], [10, 10]))).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
  });

  it('reamostra com espaçamento igual e mantém início e fim', () => {
    const pts = resample(line([0, 0], [10, 0], [10, 7.5]), 1);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[pts.length - 1]).toEqual([10, 7.5]);
    for (let i = 1; i < pts.length - 1; i++) expect(dist(pts[i - 1], pts[i])).toBeLessThanOrEqual(1.0001);
    expect(lengthOf(pts)).toBeCloseTo(17.5, 0);
  });

  it('distância acumulada cresce', () => {
    const c = cumulative(resample(arc(0, 0, 20, 20, 0, 180), 1));
    expect(c[0]).toBe(0);
    expect(c[c.length - 1]).toBeCloseTo(Math.PI * 20, 0);
  });
});

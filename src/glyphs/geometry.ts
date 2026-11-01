// Geometria dos traços: retas, arcos e curvas viram listas de pontos.
// Coordenadas num quadrado de 100 x 100 (y cresce para baixo, como na tela).

export type Pt = readonly [number, number];

/** Reta passando pelos pontos. */
export function line(...pts: Pt[]): Pt[] {
  return pts;
}

/**
 * Arco de elipse. Ângulos em graus: 0 = direita, 90 = embaixo, 180 = esquerda,
 * 270 (ou -90) = em cima. Ângulo crescendo = sentido horário na tela.
 */
export function arc(cx: number, cy: number, rx: number, ry: number, fromDeg: number, toDeg: number): Pt[] {
  const n = Math.max(2, Math.ceil(Math.abs(toDeg - fromDeg) / 2));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt;
  });
}

/** Curva de Bézier cúbica. */
export function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as Pt;
  });
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Junta partes num traço contínuo (sem repetir o ponto das emendas). */
export function join(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || dist(last, p) > 1e-6) out.push(p);
    }
  }
  return out;
}

export function lengthOf(pts: readonly Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
  return total;
}

/** Distância percorrida até cada ponto. */
export function cumulative(pts: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + dist(pts[i - 1], pts[i]));
  return out;
}

/** Pontos espaçados igualmente ao longo do traço (o último ponto sempre entra, mesmo mais perto). */
export function resample(pts: readonly Pt[], step = 1): Pt[] {
  if (pts.length < 2) return [...pts];
  const out: Pt[] = [pts[0]];
  let need = step;
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    let seg = Math.hypot(bx - ax, by - ay);
    while (seg >= need) {
      const t = need / seg;
      ax += (bx - ax) * t;
      ay += (by - ay) * t;
      out.push([ax, ay]);
      seg -= need;
      need = step;
    }
    need -= seg;
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > 1e-6) out.push(last);
  return out;
}

/** Caminho SVG ("M x y L ...") passando pelos pontos. */
export function pathD(pts: readonly Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('');
}

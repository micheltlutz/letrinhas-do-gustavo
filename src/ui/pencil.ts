// O lápis com olhinhos (SVG). A ponta fica em (0, 0); o corpo sobe inclinado.

/** Inclinação normal do lápis (graus, horário). */
export const PENCIL_TILT = 32;
/** Perto do topo da folha o lápis deita mais, para não sair da tela. */
const TILT_TOP = 62;
const SCALE = 0.5;
const INK = '#5D4037';

/** Inclinação do lápis com a ponta em y (0 = topo da folha). */
export function tiltAt(y: number): number {
  const k = Math.min(1, Math.max(0, (42 - y) / 30));
  return PENCIL_TILT + (TILT_TOP - PENCIL_TILT) * k;
}

export function artTransform(tilt: number): string {
  return `rotate(${tilt.toFixed(1)}) scale(${SCALE})`;
}

/** Desenho do lápis. A cor da ponta vem de --tip; as pupilas têm a classe "pupil". */
export function pencilSvg(tilt = PENCIL_TILT): string {
  return `
  <g class="pencil-art" transform="${artTransform(tilt)}">
    <path d="M0 0 L-4.2 -8.5 L4.2 -8.5 Z" class="tip" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-4.2 -8.5 L-8.5 -18 L8.5 -18 L4.2 -8.5 Z" fill="#FFCC80" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="-8.5" y="-46" width="17" height="28" fill="#FFCA28" stroke="${INK}" stroke-width="1.4"/>
    <rect x="-7.8" y="-45.3" width="4.2" height="26.6" fill="#FFE082"/>
    <rect x="3.6" y="-45.3" width="4.2" height="26.6" fill="#FFB300"/>
    <rect x="-9" y="-51.5" width="18" height="6" rx="1.2" fill="#B0BEC5" stroke="${INK}" stroke-width="1.4"/>
    <path d="M-8.5 -51.5 V-56 A4 4 0 0 1 -4.5 -60 H4.5 A4 4 0 0 1 8.5 -56 V-51.5 Z" fill="#F48FB1" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="-3.8" cy="-35" r="3.7" fill="#fff" stroke="${INK}" stroke-width="1"/>
    <circle cx="3.8" cy="-35" r="3.7" fill="#fff" stroke="${INK}" stroke-width="1"/>
    <circle class="pupil" cx="-3.8" cy="-35" r="1.9" fill="#263238"/>
    <circle class="pupil" cx="3.8" cy="-35" r="1.9" fill="#263238"/>
    <circle cx="-6" cy="-28.6" r="1.5" fill="#FF8A80" opacity=".8"/>
    <circle cx="6" cy="-28.6" r="1.5" fill="#FF8A80" opacity=".8"/>
    <path class="mouth" d="M-2.6 -29 Q0 -26.2 2.6 -29" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

/** Move as pupilas para olharem na direção (dx, dy) da tela. */
export function lookAt(pupils: Iterable<SVGCircleElement>, dx: number, dy: number, tilt = PENCIL_TILT): void {
  const len = Math.hypot(dx, dy);
  const a = (-tilt * Math.PI) / 180;
  // Direção da tela para o desenho do lápis (que está girado).
  const lx = len ? ((dx * Math.cos(a) - dy * Math.sin(a)) / len) * 1.5 : 0;
  const ly = len ? ((dx * Math.sin(a) + dy * Math.cos(a)) / len) * 1.5 : 0;
  for (const p of pupils) p.setAttribute('transform', `translate(${lx.toFixed(2)} ${ly.toFixed(2)})`);
}

/** Cores do arco-íris do traço, da ponta de cima à esquerda até embaixo à direita. */
export const RAINBOW = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'];

/** Cor do arco-íris num ponto da folha (igual ao gradiente do traço). */
export function rainbowAt(x: number, y: number): string {
  const t = Math.min(1, Math.max(0, (x - 10 + (y - 10)) / 160));
  const f = t * (RAINBOW.length - 1);
  const i = Math.min(RAINBOW.length - 2, Math.floor(f));
  const k = f - i;
  const a = hex(RAINBOW[i]);
  const b = hex(RAINBOW[i + 1]);
  const mix = a.map((v, j) => Math.round(v + (b[j] - v) * k));
  return `rgb(${mix.join(',')})`;
}

function hex(c: string): number[] {
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
}

/** Gradiente do arco-íris (mesma direção de rainbowAt). */
export function rainbowGradient(id: string): string {
  const stops = RAINBOW.map((c, i) => `<stop offset="${i / (RAINBOW.length - 1)}" stop-color="${c}"/>`).join('');
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="90" y2="90">${stops}</linearGradient>`;
}

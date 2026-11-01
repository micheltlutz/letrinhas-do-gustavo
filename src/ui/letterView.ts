// A folha com a letra: pista pontilhada, o lápis e o traço colorido.
//
// A criança arrasta o dedo por cima do caminho; o lápis anda junto e pinta.
// Se o dedo sai do caminho, o lápis para e espera o dedo voltar.

import { sfx } from '../audio/sfx.ts';
import { cumulative, pathD, type Pt } from '../glyphs/geometry.ts';
import { STEP, type Glyph } from '../glyphs/glyphs.ts';
import { Tracker } from '../glyphs/tracker.ts';
import { artTransform, lookAt, pencilSvg, rainbowAt, rainbowGradient, tiltAt } from './pencil.ts';

export interface LetterEvents {
  /** Letra completa. */
  onDone(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Uma notinha a cada tantas unidades pintadas. */
const NOTE_EVERY = 4;
const SPARKLE_EVERY = 3.5;
/** Escala pentatônica (Dó maior), subindo ao longo da letra. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
/** Até onde a bolinha-guia mostra o caminho. */
const GUIDE_LEN = 32;
const GUIDE_MS = 1300;
const GUIDE_PAUSE_MS = 700;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export class LetterView {
  readonly root: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly lanes: SVGGElement;
  private readonly dots: SVGGElement;
  private readonly traces: SVGGElement;
  private readonly startMark: SVGGElement;
  private readonly goalMark: SVGGElement;
  private readonly guide: SVGCircleElement;
  private readonly sparkles: SVGGElement;
  private readonly pencil: SVGGElement;
  private readonly pencilBody: SVGGElement;
  private readonly pupils: SVGCircleElement[];
  private readonly art: SVGGElement;
  private tilt = 0;
  private readonly events: LetterEvents;

  private glyph: Glyph | null = null;
  private tracker = new Tracker([[[0, 0]]]);
  private traceEls: SVGPathElement[] = [];
  private dotEls: SVGPathElement[] = [];
  private lengths: number[][] = [];
  private totalLength = 1;
  private pointerId: number | null = null;
  /** Já esteve no caminho neste toque (para avisar quando sair). */
  private wasOn = false;
  private lastNote = 0;
  private lastSparkle = 0;
  private guideStart = 0;
  private raf = 0;

  constructor(events: LetterEvents) {
    this.events = events;
    this.root = document.createElement('div');
    this.root.className = 'paper-wrap';
    const paper = document.createElement('div');
    paper.className = 'paper';
    this.root.append(paper);

    this.svg = el('svg', { viewBox: '0 0 100 100', class: 'letter' });
    this.svg.innerHTML = `
      <defs>${rainbowGradient('rainbow')}</defs>
      <g class="guides">
        <line x1="4" x2="96" y1="12" y2="12"/><line x1="4" x2="96" y1="88" y2="88"/>
        <line class="mid" x1="4" x2="96" y1="50" y2="50"/>
      </g>`;
    this.lanes = el('g', { class: 'lanes' });
    this.dots = el('g', { class: 'dots' });
    this.traces = el('g', { class: 'traces' });
    this.goalMark = el('g', { class: 'goal' });
    this.goalMark.innerHTML = `<path d="M0 -6 L1.8 -1.9 L6 -1.6 L2.7 1.2 L3.7 5.4 L0 3.1 L-3.7 5.4 L-2.7 1.2 L-6 -1.6 L-1.8 -1.9 Z"/>`;
    this.startMark = el('g', { class: 'start' });
    this.startMark.innerHTML = `<circle class="ring" r="6.5"/><circle class="dot" r="4.6"/><path class="arrow" d="M-1.6 -2.4 L2.6 0 L-1.6 2.4 Z"/>`;
    this.guide = el('circle', { class: 'guide', r: 3.2 });
    this.sparkles = el('g', { class: 'sparkles' });
    this.pencil = el('g', { class: 'pencil' });
    this.pencilBody = el('g', { class: 'pencil-body' });
    this.pencilBody.innerHTML = pencilSvg();
    this.pencil.append(this.pencilBody);
    this.pupils = [...this.pencilBody.querySelectorAll<SVGCircleElement>('.pupil')];
    this.art = this.pencilBody.querySelector<SVGGElement>('.pencil-art')!;
    this.svg.append(this.lanes, this.dots, this.traces, this.goalMark, this.startMark, this.guide, this.sparkles, this.pencil);
    paper.append(this.svg);

    this.svg.addEventListener('pointerdown', (e) => this.onDown(e));
    this.svg.addEventListener('pointermove', (e) => this.onMove(e));
    this.svg.addEventListener('pointerup', (e) => this.onUp(e));
    this.svg.addEventListener('pointercancel', (e) => this.onUp(e));
    this.svg.addEventListener('lostpointercapture', (e) => this.onUp(e));
  }

  load(glyph: Glyph): void {
    this.glyph = glyph;
    this.tracker = new Tracker(glyph.strokes, STEP);
    this.lengths = glyph.strokes.map((s) => cumulative(s));
    this.totalLength = this.lengths.reduce((sum, c) => sum + c[c.length - 1], 0) || 1;
    this.lanes.replaceChildren();
    this.dots.replaceChildren();
    this.traces.replaceChildren();
    this.sparkles.replaceChildren();
    this.traceEls = [];
    this.dotEls = [];
    for (const s of glyph.strokes) {
      const d = pathD(s);
      this.lanes.append(el('path', { d, class: 'lane-edge' }), el('path', { d, class: 'lane' }));
      const dots = el('path', { d, class: 'dot-line' });
      this.dots.append(dots);
      this.dotEls.push(dots);
      const trace = el('path', { d, class: 'trace', stroke: 'url(#rainbow)' });
      this.traces.append(trace);
      this.traceEls.push(trace);
    }
    this.restart();
  }

  restart(): void {
    this.tracker.reset();
    this.pointerId = null;
    this.wasOn = false;
    this.lastNote = 0;
    this.lastSparkle = 0;
    this.svg.classList.remove('finished');
    this.pencil.getAnimations().forEach((a) => a.cancel());
    this.sparkles.replaceChildren();
    this.renderAll();
    this.placePencil(false);
    this.startGuide();
  }

  /** Para tudo (troca de tela, app em segundo plano). */
  stop(): void {
    this.pointerId = null;
    this.pencil.classList.remove('waiting');
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.guide.style.opacity = '0';
  }

  /** Continua (bolinha-guia) ao voltar para a tela. */
  resume(): void {
    if (!this.tracker.done) this.startGuide();
  }

  // ---------- desenho ----------

  /** Progresso já pintado (unidades) de um traço. */
  private paintedOf(i: number): number {
    const t = this.tracker;
    const c = this.lengths[i];
    if (i < t.stroke) return c[c.length - 1];
    if (i > t.stroke) return 0;
    return c[t.index];
  }

  private renderAll(): void {
    this.traceEls.forEach((_, i) => this.renderStroke(i));
    this.renderMarks();
  }

  private renderStroke(i: number): void {
    const len = this.paintedOf(i);
    const trace = this.traceEls[i];
    trace.style.display = len > 0.01 ? '' : 'none';
    trace.style.strokeDasharray = `${len.toFixed(2)} 1000`;
    const t = this.tracker;
    this.dotEls[i].classList.toggle('future', i > t.stroke);
    this.dotEls[i].classList.toggle('current', i === t.stroke);
  }

  private renderMarks(): void {
    const t = this.tracker;
    const glyph = this.glyph;
    if (!glyph || t.done) {
      this.startMark.style.display = 'none';
      this.goalMark.style.display = 'none';
      return;
    }
    const s = glyph.strokes[t.stroke];
    const [x0, y0] = s[0];
    const [x1, y1] = s[Math.min(s.length - 1, 5)];
    const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    // A bolinha de começo só aparece antes de começar o traço.
    this.startMark.style.display = t.index === 0 ? '' : 'none';
    this.startMark.setAttribute('transform', `translate(${x0} ${y0}) rotate(${angle.toFixed(1)})`);
    const [gx, gy] = s[s.length - 1];
    this.goalMark.style.display = '';
    this.goalMark.setAttribute('transform', `translate(${gx} ${gy})`);
  }

  /** Coloca o lápis na ponta do traço (com pulinho, se for para outro traço). */
  private placePencil(hop: boolean, from?: Pt): void {
    const [x, y] = this.tracker.point;
    const to = `translate(${x}px, ${y}px)`;
    this.pencil.style.setProperty('--tip', rainbowAt(x, y));
    this.pencil.getAnimations().forEach((a) => a.cancel());
    if (hop && from) {
      const mx = (from[0] + x) / 2;
      const my = Math.min(from[1], y) - 14;
      this.pencil.animate(
        [
          { transform: `translate(${from[0]}px, ${from[1]}px)` },
          { transform: `translate(${mx}px, ${my}px)` },
          { transform: to },
        ],
        { duration: 420, easing: 'ease-in-out' },
      );
    }
    this.pencil.style.transform = to;
    this.tilt = tiltAt(y);
    this.art.setAttribute('transform', artTransform(this.tilt));
    const next = this.lookTarget();
    if (next) lookAt(this.pupils, next[0] - x, next[1] - y, this.tilt);
  }

  /** Para onde o lápis vai (alguns pontos à frente). */
  private lookTarget(): Pt | null {
    const t = this.tracker;
    if (t.done || !this.glyph) return null;
    const s = this.glyph.strokes[t.stroke];
    return s[Math.min(s.length - 1, t.index + 4)];
  }

  // ---------- toque ----------

  private toSvg(e: PointerEvent): Pt | null {
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y];
  }

  private onDown(e: PointerEvent): void {
    if (this.pointerId !== null || this.tracker.done) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    try {
      this.svg.setPointerCapture(e.pointerId);
    } catch {
      // segue sem captura
    }
    this.stopGuide();
    this.wasOn = false;
    const r = this.feed(e);
    if (r === 'off') this.callFinger();
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    // No iPad os movimentos vêm agrupados; usa todos para o traço ficar contínuo.
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of events.length > 0 ? events : [e]) {
      this.feed(ev);
      if (this.tracker.done) break;
    }
  }

  private onUp(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.pencil.classList.remove('waiting');
    if (!this.tracker.done) this.startGuide();
  }

  private feed(e: PointerEvent): ReturnType<Tracker['feed']> | null {
    const p = this.toSvg(e);
    if (!p) return null;
    const t = this.tracker;
    const before = t.stroke;
    const from = t.point;
    const r = t.feed(p[0], p[1]);
    if (r === 'off') {
      if (this.wasOn) {
        this.wasOn = false;
        this.pencil.classList.add('waiting');
        sfx.oops();
      }
      lookAt(this.pupils, p[0] - from[0], p[1] - from[1], this.tilt);
      return r;
    }
    if (!this.wasOn) {
      this.wasOn = true;
      this.pencil.classList.remove('waiting');
    }
    if (r === 'hold') return r;

    const done = this.paintedTotal();
    this.chime(done);
    if (r === 'advance') {
      this.renderStroke(before);
      if (this.startMark.style.display !== 'none') this.renderMarks();
      this.placePencil(false);
      return r;
    }
    // Terminou um traço (ou a letra).
    this.renderAll();
    this.popGoal(this.glyph!.strokes[before]);
    if (r === 'stroke') {
      sfx.strokeDone();
      this.placePencil(true, this.glyph!.strokes[before].at(-1)!);
      this.wasOn = false;
    } else {
      this.finish();
    }
    return r;
  }

  private paintedTotal(): number {
    let total = 0;
    for (let i = 0; i < this.lengths.length; i++) total += this.paintedOf(i);
    return total;
  }

  /** Notinhas subindo e brilhinhos enquanto pinta. */
  private chime(painted: number): void {
    if (painted - this.lastNote >= NOTE_EVERY) {
      this.lastNote = painted;
      const k = Math.min(SCALE.length - 1, Math.floor((painted / this.totalLength) * SCALE.length));
      sfx.twinkle(SCALE[k]);
    }
    if (painted - this.lastSparkle >= SPARKLE_EVERY) {
      this.lastSparkle = painted;
      this.sparkle(this.tracker.point);
    }
  }

  private sparkle([x, y]: Pt): void {
    if (this.sparkles.childElementCount > 14) return;
    const star = el('path', {
      d: 'M0 -2.6 L0.8 -0.8 L2.6 0 L0.8 0.8 L0 2.6 L-0.8 0.8 L-2.6 0 L-0.8 -0.8 Z',
      fill: rainbowAt(x, y),
    });
    this.sparkles.append(star);
    const dx = (Math.random() - 0.5) * 14;
    const dy = -4 - Math.random() * 9;
    star
      .animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(0.4)`, opacity: 1 },
          { transform: `translate(${x + dx}px, ${y + dy}px) scale(1.2) rotate(90deg)`, opacity: 0 },
        ],
        { duration: 650, easing: 'ease-out' },
      )
      .finished.catch(() => {})
      .then(() => star.remove());
  }

  /** A estrela do fim do traço dá um pulo. */
  private popGoal(stroke: readonly Pt[]): void {
    const [x, y] = stroke[stroke.length - 1];
    const star = el('path', {
      d: 'M0 -6 L1.8 -1.9 L6 -1.6 L2.7 1.2 L3.7 5.4 L0 3.1 L-3.7 5.4 L-2.7 1.2 L-6 -1.6 L-1.8 -1.9 Z',
      fill: '#FFC107',
    });
    this.sparkles.append(star);
    star
      .animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
          { transform: `translate(${x}px, ${y - 8}px) scale(2) rotate(72deg)`, opacity: 0 },
        ],
        { duration: 600, easing: 'ease-out' },
      )
      .finished.catch(() => {})
      .then(() => star.remove());
  }

  /** Dedo tocou longe: o lápis pula para mostrar onde está. */
  private callFinger(): void {
    this.pencilBody.animate(
      [{ transform: 'none' }, { transform: 'translateY(-6px)' }, { transform: 'none' }, { transform: 'translateY(-3px)' }, { transform: 'none' }],
      { duration: 500, easing: 'ease-out' },
    );
    this.startMark.querySelector('.ring')?.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(2.2)', opacity: 0 }],
      { duration: 600, easing: 'ease-out' },
    );
    sfx.hop();
  }

  private finish(): void {
    this.stop();
    this.svg.classList.add('finished');
    this.placePencil(false);
    this.pencilBody.animate(
      [
        { transform: 'none' },
        { transform: 'translateY(-10px) rotate(-12deg)' },
        { transform: 'none' },
        { transform: 'translateY(-6px) rotate(10deg)' },
        { transform: 'none' },
      ],
      { duration: 900, easing: 'ease-in-out' },
    );
    this.events.onDone();
  }

  // ---------- bolinha-guia ----------

  private startGuide(): void {
    cancelAnimationFrame(this.raf);
    this.guideStart = performance.now();
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick);
      this.drawGuide(now);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopGuide(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.guide.style.opacity = '0';
  }

  private drawGuide(now: number): void {
    const t = this.tracker;
    if (t.done || !this.glyph) {
      this.stopGuide();
      return;
    }
    const cycle = (now - this.guideStart) % (GUIDE_MS + GUIDE_PAUSE_MS);
    if (cycle > GUIDE_MS) {
      this.guide.style.opacity = '0';
      return;
    }
    const k = cycle / GUIDE_MS;
    const s = this.glyph.strokes[t.stroke];
    const steps = Math.min(s.length - 1 - t.index, Math.round(GUIDE_LEN / STEP));
    const [x, y] = s[t.index + Math.round(steps * k)];
    this.guide.setAttribute('cx', x.toFixed(2));
    this.guide.setAttribute('cy', y.toFixed(2));
    this.guide.style.opacity = String(Math.sin(k * Math.PI).toFixed(2));
  }
}

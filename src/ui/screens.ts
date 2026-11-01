// As três telas: inicial, mapa (letras, números e o nome) e a folha de traçar.

import { sfx } from '../audio/sfx.ts';
import { pathD } from '../glyphs/geometry.ts';
import { GLYPHS, NAMES, ORDERS, glyphById, groupOf, type Glyph, type LetterCase } from '../glyphs/glyphs.ts';
import { store } from '../storage.ts';
import { clearConfetti, confetti } from './confetti.ts';
import { ICONS, iconButton } from './icons.ts';
import { LetterView } from './letterView.ts';
import { pencilSvg, rainbowAt, rainbowGradient, RAINBOW } from './pencil.ts';

export interface Nav {
  home(): void;
  map(): void;
  /** Letra/número na posição `index` do mapa. */
  play(index: number): void;
  /** Escrever o nome, letra por letra. */
  name(): void;
}

/** Sequência que está sendo jogada: o mapa todo ou o nome. */
export type Mode = 'all' | 'name';

function makeScreen(className: string): HTMLElement {
  const el = document.createElement('section');
  el.className = `screen ${className}`;
  el.hidden = true;
  return el;
}

function onTap<T extends HTMLElement>(button: T, action: () => void, sound = true): T {
  button.addEventListener('click', () => {
    if (sound) sfx.pop();
    action();
  });
  return button;
}

/** Texto com cada letra de uma cor do arco-íris. */
function rainbowText(text: string): string {
  return [...text].map((c, i) => `<span style="color:${RAINBOW[i % RAINBOW.length]}">${c}</span>`).join('');
}

// "A" pintado de arco-íris com o lápis (tela inicial).
function heroSvg(): string {
  const a = glyphById('A');
  const lanes = a.strokes.map((s) => `<path class="lane-edge" d="${pathD(s)}"/><path class="lane" d="${pathD(s)}"/>`).join('');
  const traces = a.strokes.map((s) => `<path class="trace" stroke="url(#rainbow-hero)" d="${pathD(s)}"/>`).join('');
  const [x, y] = a.strokes[2][a.strokes[2].length - 1];
  return `
  <svg viewBox="0 0 100 100" class="letter" aria-hidden="true">
    <defs>${rainbowGradient('rainbow-hero')}</defs>
    ${lanes}${traces}
    <g class="pencil" style="transform: translate(${x}px, ${y}px); --tip: ${rainbowAt(x, y)}"><g class="pencil-body">${pencilSvg()}</g></g>
  </svg>`;
}

export class HomeScreen {
  readonly el = makeScreen('home');
  private readonly soundBtn: HTMLButtonElement;

  constructor(nav: Nav) {
    this.el.dataset.group = '0';
    this.el.innerHTML = `
      <h1 class="title">Letrinhas <span>do Gustavo</span></h1>
      <div class="hero"><button type="button" class="hero-btn" aria-label="A">${heroSvg()}</button></div>
      <div class="home-actions"></div>`;
    const hero = this.el.querySelector<HTMLButtonElement>('.hero-btn')!;
    hero.addEventListener('click', () => {
      sfx.say('A');
      hero.animate([{ transform: 'none' }, { transform: 'scale(1.06) rotate(-3deg)' }, { transform: 'none' }], {
        duration: 450,
        easing: 'ease-out',
      });
    });

    const actions = this.el.querySelector('.home-actions')!;
    this.soundBtn = onTap(iconButton('soundOn', 'Som'), () => {
      store.sound = !store.sound;
      this.render();
    });
    actions.append(
      onTap(iconButton('grid', 'Letras'), () => nav.map()),
      onTap(iconButton('play', 'Jogar', 'big play'), () => nav.play(store.nextOf(ORDERS[store.letterCase]))),
      this.soundBtn,
    );

    // Aberto pela página "Jogos do Gustavo": botão para voltar para lá.
    if (location.hash === '#jogos') {
      this.el.append(
        onTap(iconButton('back', 'Todos os jogos', 'back-to-games'), () => location.assign('/jogos-do-gustavo/')),
      );
    }
  }

  show(): void {
    this.render();
  }

  private render(): void {
    this.soundBtn.innerHTML = store.sound ? ICONS.soundOn : ICONS.soundOff;
    this.soundBtn.classList.toggle('off', !store.sound);
  }
}

export class MapScreen {
  readonly el = makeScreen('map');
  private readonly tiles: HTMLButtonElement[] = [];
  private readonly namePill: HTMLButtonElement;
  private readonly caseButtons: Record<LetterCase, HTMLButtonElement>;

  constructor(nav: Nav) {
    this.el.dataset.group = '0';
    this.el.innerHTML = `<div class="topbar"></div><div class="map-body"><div class="map-grid"></div></div>`;
    this.namePill = document.createElement('button');
    this.namePill.type = 'button';
    this.namePill.className = 'name-pill';

    // Chave A / a: maiúsculas ou minúsculas.
    const toggle = document.createElement('div');
    toggle.className = 'case-toggle';
    const caseButton = (c: LetterCase, text: string, label: string) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-label', label);
      onTap(b, () => {
        store.letterCase = c;
        this.show();
      });
      toggle.append(b);
      return b;
    };
    this.caseButtons = {
      upper: caseButton('upper', 'A', 'Letras maiúsculas'),
      lower: caseButton('lower', 'a', 'Letras minúsculas'),
    };

    this.el
      .querySelector('.topbar')!
      .append(onTap(iconButton('home', 'Início'), () => nav.home()), onTap(this.namePill, () => nav.name()), toggle);
    const grid = this.el.querySelector('.map-grid')!;
    ORDERS.upper.forEach((_, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.innerHTML = `<span class="num"></span><span class="sticker">${ICONS.star}</span>`;
      onTap(tile, () => nav.play(i));
      grid.appendChild(tile);
      this.tiles.push(tile);
    });
  }

  show(): void {
    const c = store.letterCase;
    const order = ORDERS[c];
    const next = store.nextOf(order);
    const allDone = order.every((id) => store.isDone(id));
    this.tiles.forEach((tile, i) => {
      const id = order[i];
      tile.querySelector('.num')!.textContent = id;
      tile.setAttribute('aria-label', id);
      tile.dataset.group = String(groupOf(id));
      tile.classList.toggle('done', store.isDone(id));
      tile.classList.toggle('next', !allDone && i === next);
    });
    this.namePill.innerHTML = `${rainbowText(NAMES[c])}<span class="sticker">${ICONS.star}</span>`;
    this.namePill.setAttribute('aria-label', `Escrever ${NAMES[c]}`);
    this.namePill.classList.toggle('done', store.isNameDone(c));
    for (const k of ['upper', 'lower'] as const) this.caseButtons[k].setAttribute('aria-pressed', String(k === c));
  }
}

export class GameScreen {
  readonly el = makeScreen('game');
  private readonly view: LetterView;
  private readonly badge: HTMLButtonElement;
  private readonly skipBtn: HTMLButtonElement;
  private readonly word: HTMLElement;
  private readonly win: HTMLElement;
  private readonly nav: Nav;
  private mode: Mode = 'all';
  private letterCase: LetterCase = 'upper';
  private sequence: readonly string[] = ORDERS.upper;
  private index = 0;
  private glyph: Glyph = GLYPHS[0];
  /** Muda a cada letra aberta, para cancelar comemorações antigas. */
  private session = 0;

  constructor(nav: Nav) {
    this.nav = nav;
    this.view = new LetterView({ onDone: () => void this.celebrate() });

    const controls = document.createElement('div');
    controls.className = 'controls';
    // A letra no botão: tocar fala o nome dela.
    this.badge = document.createElement('button');
    this.badge.type = 'button';
    this.badge.className = 'badge';
    this.badge.addEventListener('click', () => {
      sfx.say(this.glyph.say);
      this.badge.animate([{ transform: 'none' }, { transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 300 });
    });
    this.skipBtn = onTap(iconButton('next', 'Próxima'), () => this.go(this.index + 1));
    controls.append(
      onTap(iconButton('grid', 'Letras'), () => nav.map()),
      this.badge,
      onTap(
        iconButton('restart', 'Recomeçar'),
        () => {
          sfx.undo();
          this.open(this.mode, this.index);
        },
        false,
      ),
      this.skipBtn,
    );

    const board = document.createElement('div');
    board.className = 'board';
    this.word = document.createElement('div');
    this.word.className = 'word';
    board.append(this.word, this.view.root);

    this.win = document.createElement('div');
    this.win.className = 'win';
    this.win.hidden = true;

    this.el.append(controls, board, this.win);
  }

  open(mode: Mode, index: number): void {
    this.session++;
    this.mode = mode;
    this.letterCase = store.letterCase;
    this.sequence = mode === 'name' ? [...NAMES[this.letterCase]] : ORDERS[this.letterCase];
    this.index = index;
    this.glyph = glyphById(this.sequence[index]);
    this.el.dataset.group = mode === 'name' ? 'name' : String(groupOf(this.glyph.id));
    this.badge.textContent = this.glyph.id;
    this.badge.setAttribute('aria-label', this.glyph.say);
    this.skipBtn.hidden = index >= this.sequence.length - 1;
    this.word.hidden = mode !== 'name';
    if (mode === 'name') this.word.innerHTML = this.sequence.map((c) => `<span class="word-letter">${c}</span>`).join('');
    this.renderWord();
    this.win.hidden = true;
    this.el.classList.remove('won');
    clearConfetti(this.el);
    this.view.load(this.glyph);
  }

  close(): void {
    this.session++;
    clearConfetti(this.el);
    this.view.stop();
  }

  /** App foi para o segundo plano / voltou. */
  pause(): void {
    this.view.stop();
  }

  resume(): void {
    this.view.resume();
  }

  private go(index: number): void {
    if (index >= this.sequence.length) this.nav.map();
    else this.open(this.mode, index);
  }

  /** No modo nome: letras já escritas coloridas, a atual em destaque. */
  private renderWord(done = false): void {
    [...this.word.children].forEach((span, i) => {
      span.classList.toggle('done', i < this.index || (done && i === this.index));
      span.classList.toggle('current', i === this.index && !done);
      (span as HTMLElement).style.setProperty('--c', RAINBOW[i % RAINBOW.length]);
    });
  }

  private async celebrate(): Promise<void> {
    const session = this.session;
    store.markDone(this.glyph.id);
    const last = this.index === this.sequence.length - 1;
    const nameDone = this.mode === 'name' && last;
    if (this.mode === 'name') this.renderWord(true);
    if (nameDone) store.markNameDone(this.letterCase);
    await new Promise((r) => setTimeout(r, 250));
    if (session !== this.session) return;
    sfx.win();
    confetti(this.el, nameDone ? 160 : 90);
    this.showWin(last, nameDone);
    await new Promise((r) => setTimeout(r, 900));
    if (session !== this.session) return;
    sfx.say(nameDone ? 'Gustavo!' : this.glyph.say);
  }

  private showWin(last: boolean, nameDone: boolean): void {
    this.win.innerHTML = `<div class="win-card"><div class="medal ${nameDone ? 'trophy' : ''}">${
      nameDone ? ICONS.trophy : ICONS.star
    }</div></div>`;
    const card = this.win.querySelector('.win-card')!;
    card.append(
      onTap(iconButton(last ? 'grid' : 'next', last ? 'Letras' : 'Próxima', 'big next'), () =>
        last ? this.nav.map() : this.go(this.index + 1),
      ),
    );
    if (!last) card.append(onTap(iconButton('grid', 'Letras', 'small'), () => this.nav.map()));
    this.win.hidden = false;
    this.el.classList.add('won');
  }
}

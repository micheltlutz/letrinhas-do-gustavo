import './styles.css';
import { initAudio } from './audio/sfx.ts';
import { applyPendingUpdate, setupPWA } from './pwa.ts';
import { GameScreen, HomeScreen, MapScreen, type Nav } from './ui/screens.ts';

type ScreenName = 'home' | 'map' | 'game';

/** Bloqueia zoom, menu de toque longo, seleção e rolagem do Safari. */
function blockBrowserGestures(): void {
  const prevent = (e: Event) => e.preventDefault();
  for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart']) {
    document.addEventListener(type, prevent, { passive: false });
  }
  document.addEventListener('touchmove', prevent, { passive: false });
  // Sem um listener de touchstart, o iOS não mostra o efeito de botão apertado (:active).
  document.addEventListener('touchstart', () => {}, { passive: true });
}

blockBrowserGestures();
initAudio();

let current: ScreenName = 'home';

const nav: Nav = {
  home: () => show('home'),
  map: () => show('map'),
  play: (index) => {
    show('game');
    game.open('all', index);
  },
  name: () => {
    show('game');
    game.open('name', 0);
  },
};

const home = new HomeScreen(nav);
const map = new MapScreen(nav);
const game = new GameScreen(nav);
document.getElementById('app')!.append(home.el, map.el, game.el);

function show(name: ScreenName): void {
  if (current === 'game' && name !== 'game') game.close();
  current = name;
  home.el.hidden = name !== 'home';
  map.el.hidden = name !== 'map';
  game.el.hidden = name !== 'game';
  if (name === 'home') home.show();
  if (name === 'map') map.show();
  // Atualizações só fora da folha de traçar.
  if (name !== 'game') applyPendingUpdate();
}

document.addEventListener('visibilitychange', () => {
  if (current !== 'game') return;
  if (document.visibilityState === 'hidden') game.pause();
  else game.resume();
});

show('home');
setupPWA(() => current !== 'game');

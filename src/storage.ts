// Progresso salvo no próprio iPad. Se o armazenamento falhar (modo privado,
// por exemplo), o jogo continua funcionando, só não lembra o progresso.

import type { LetterCase } from './glyphs/glyphs.ts';

const KEY = 'letrinhas-do-gustavo:v1';

interface SaveData {
  /** Letras e números já traçados ("A", "a", "7"...). */
  done: string[];
  /** Em que tipo de letra já escreveu o nome inteiro. */
  nameDone: LetterCase[];
  /** Maiúsculas ou minúsculas no mapa. */
  letterCase: LetterCase;
  sound: boolean;
}

function readNameDone(v: unknown): LetterCase[] {
  if (v === true) return ['upper']; // versão antiga: só existia o nome em maiúsculas
  return Array.isArray(v) ? v.filter((c): c is LetterCase => c === 'upper' || c === 'lower') : [];
}

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveData>;
      return {
        done: Array.isArray(data.done) ? data.done.filter((d) => typeof d === 'string') : [],
        nameDone: readNameDone(data.nameDone),
        letterCase: data.letterCase === 'lower' ? 'lower' : 'upper',
        sound: data.sound !== false,
      };
    }
  } catch {
    // ignora: começa do zero
  }
  return { done: [], nameDone: [], letterCase: 'upper', sound: true };
}

const state = read();

function write(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento disponível
  }
}

export const store = {
  isDone: (id: string) => state.done.includes(id),
  markDone(id: string): void {
    if (!state.done.includes(id)) {
      state.done.push(id);
      write();
    }
  },
  /** Primeira ainda não feita, na ordem dada (ou a primeira, se já fez todas). */
  nextOf(order: readonly string[]): number {
    const i = order.findIndex((id) => !state.done.includes(id));
    return i < 0 ? 0 : i;
  },
  isNameDone: (c: LetterCase) => state.nameDone.includes(c),
  markNameDone(c: LetterCase): void {
    if (!state.nameDone.includes(c)) {
      state.nameDone.push(c);
      write();
    }
  },
  get letterCase(): LetterCase {
    return state.letterCase;
  },
  set letterCase(c: LetterCase) {
    state.letterCase = c;
    write();
  },
  get sound(): boolean {
    return state.sound;
  },
  set sound(on: boolean) {
    state.sound = on;
    write();
  },
};

// Progresso salvo no próprio iPad. Se o armazenamento falhar (modo privado,
// por exemplo), o jogo continua funcionando, só não lembra o progresso.

const KEY = 'letrinhas-do-gustavo:v1';

interface SaveData {
  /** Letras e números já traçados ("A", "7"...). */
  done: string[];
  /** Já escreveu o nome inteiro. */
  nameDone: boolean;
  sound: boolean;
}

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveData>;
      return {
        done: Array.isArray(data.done) ? data.done.filter((d) => typeof d === 'string') : [],
        nameDone: data.nameDone === true,
        sound: data.sound !== false,
      };
    }
  } catch {
    // ignora: começa do zero
  }
  return { done: [], nameDone: false, sound: true };
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
  get nameDone(): boolean {
    return state.nameDone;
  },
  markNameDone(): void {
    state.nameDone = true;
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

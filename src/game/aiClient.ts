import { chooseMove, type AIRequest } from './ai';
import type { Move } from './engine';
import AIWorker from './ai.worker?worker&inline';

type Resolver = (m: Move | null) => void;

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, { resolve: Resolver; req: AIRequest }>();

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    const w: Worker = new AIWorker();
    worker = w;
    w.onmessage = (e: MessageEvent<{ id: number; move: Move | null }>) => {
      const entry = pending.get(e.data.id);
      if (entry) {
        pending.delete(e.data.id);
        entry.resolve(e.data.move);
      }
    };
    w.onerror = () => {
      // Fall back to computing on the main thread.
      workerBroken = true;
      w.terminate();
      worker = null;
      for (const [id, entry] of pending) {
        pending.delete(id);
        entry.resolve(chooseMove(entry.req));
      }
    };
    return w;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** Ask the AI for a move. Runs in a Web Worker when possible so the UI stays smooth. */
export function requestAIMove(req: AIRequest): Promise<Move | null> {
  return new Promise((resolve) => {
    const w = getWorker();
    if (!w) {
      setTimeout(() => resolve(chooseMove(req)), 20);
      return;
    }
    const id = nextId++;
    pending.set(id, { resolve, req });
    w.postMessage({ id, ...req });
  });
}

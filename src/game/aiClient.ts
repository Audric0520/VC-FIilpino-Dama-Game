import { analyzePosition, chooseMove, type AIRequest, type AnalysisRequest, type PositionAnalysis } from './ai';
import type { Move } from './engine';
import AIWorker from './ai.worker?worker&inline';
import EvalWorker from './eval.worker?worker&inline';

type Resolver = (m: Move | null) => void;
type EvalResolver = (a: PositionAnalysis | null) => void;

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

// --- Position evaluation (evaluation bar) ------------------------------------

let evalWorker: Worker | null = null;
let evalWorkerBroken = false;
const pendingEvals = new Map<number, { resolve: EvalResolver; req: AnalysisRequest }>();

function getEvalWorker(): Worker | null {
  if (evalWorkerBroken) return null;
  if (evalWorker) return evalWorker;
  try {
    const w: Worker = new EvalWorker();
    evalWorker = w;
    w.onmessage = (e: MessageEvent<{ id: number; analysis: PositionAnalysis | null }>) => {
      const entry = pendingEvals.get(e.data.id);
      if (entry) {
        pendingEvals.delete(e.data.id);
        entry.resolve(e.data.analysis);
      }
    };
    w.onerror = () => {
      // Fall back to computing on the main thread.
      evalWorkerBroken = true;
      w.terminate();
      evalWorker = null;
      for (const [id, entry] of pendingEvals) {
        pendingEvals.delete(id);
        entry.resolve(analyzePosition(entry.req));
      }
    };
    return w;
  } catch {
    evalWorkerBroken = true;
    return null;
  }
}

/**
 * Analyse a position for the evaluation bar. Runs in a dedicated Web Worker
 * (separate from the move-choosing worker) so the bar keeps updating while
 * the AI thinks. Returns null when the request is cancelled via `signal`.
 */
export function requestEval(req: AnalysisRequest, signal?: AbortSignal): Promise<PositionAnalysis | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }
    const w = getEvalWorker();
    if (!w) {
      const t = window.setTimeout(() => {
        if (signal?.aborted) {
          resolve(null);
          return;
        }
        resolve(analyzePosition(req));
      }, 20);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          resolve(null);
        },
        { once: true },
      );
      return;
    }
    const id = nextId++;
    const entry = { resolve, req };
    pendingEvals.set(id, entry);
    signal?.addEventListener(
      'abort',
      () => {
        if (pendingEvals.delete(id)) resolve(null);
      },
      { once: true },
    );
    w.postMessage({ id, ...req });
  });
}

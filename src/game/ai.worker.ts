/// <reference lib="webworker" />
import { chooseMove, type AIRequest } from './ai';

self.onmessage = (e: MessageEvent<AIRequest & { id: number }>) => {
  const { id, ...req } = e.data;
  let move = null;
  try {
    move = chooseMove(req);
  } catch {
    move = null;
  }
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, move });
};

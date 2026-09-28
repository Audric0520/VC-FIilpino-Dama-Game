/// <reference lib="webworker" />
import { analyzePosition, type AnalysisRequest, type PositionAnalysis } from './ai';

self.onmessage = (e: MessageEvent<AnalysisRequest & { id: number }>) => {
  const { id, ...req } = e.data;
  let analysis: PositionAnalysis | null = null;
  try {
    analysis = analyzePosition(req);
  } catch {
    analysis = null;
  }
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, analysis });
};

/**
 * Annabelle.AI Types
 * Type definitions for the RAM-optimized indexer and retriever
 */

export interface IndexEntry {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, unknown>;
}

export interface IndexStats {
  totalEntries: number;
  memoryUsage: number;
  lastUpdate: number;
}

export interface WorkerMessage<T = unknown> {
  type: string;
  payload: T;
  id?: string;
}

export interface WorkerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
}

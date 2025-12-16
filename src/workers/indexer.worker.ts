/**
 * Indexer Worker
 * Memory-efficient indexing in a Web Worker
 */

import type { IndexEntry, IndexStats, WorkerMessage, WorkerResponse } from '../types';
import { MemoryMonitor, BatchProcessor } from '../utils/memory';

class Indexer {
  private index: Map<string, IndexEntry>;
  private memoryMonitor: MemoryMonitor;
  private batchProcessor: BatchProcessor<IndexEntry>;

  constructor() {
    this.index = new Map();
    this.memoryMonitor = new MemoryMonitor(512); // 512MB limit for worker
    this.batchProcessor = new BatchProcessor(50);
  }

  /**
   * Add a single entry to the index
   */
  addEntry(entry: IndexEntry): void {
    if (this.memoryMonitor.isMemoryCritical()) {
      this.compact();
    }
    this.index.set(entry.id, entry);
  }

  /**
   * Add multiple entries in batches
   */
  async addEntries(entries: IndexEntry[]): Promise<void> {
    for await (const processed of this.batchProcessor.processBatches(
      entries,
      async (batch) => {
        batch.forEach((entry) => {
          this.index.set(entry.id, entry);
        });
      }
    )) {
      // Progress tracking
      if (processed % 100 === 0) {
        console.log(`Indexed ${processed}/${entries.length} entries`);
      }
    }
  }

  /**
   * Remove an entry from the index
   */
  removeEntry(id: string): boolean {
    return this.index.delete(id);
  }

  /**
   * Get an entry by ID
   */
  getEntry(id: string): IndexEntry | undefined {
    return this.index.get(id);
  }

  /**
   * Search entries by content (simple substring match)
   */
  search(query: string, limit = 10): IndexEntry[] {
    const results: IndexEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of this.index.values()) {
      if (entry.content.toLowerCase().includes(lowerQuery)) {
        results.push(entry);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get index statistics
   */
  getStats(): IndexStats {
    return {
      totalEntries: this.index.size,
      memoryUsage: this.memoryMonitor.getMemoryUsage(),
      lastUpdate: Date.now(),
    };
  }

  /**
   * Compact the index (remove old/unused entries)
   */
  private compact(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, entry] of this.index.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.index.delete(id);
      }
    }
  }

  /**
   * Clear the entire index
   */
  clear(): void {
    this.index.clear();
  }
}

// Initialize indexer instance
const indexer = new Indexer();

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case 'addEntry':
        indexer.addEntry(payload as IndexEntry);
        result = { success: true };
        break;

      case 'addEntries':
        await indexer.addEntries(payload as IndexEntry[]);
        result = { success: true };
        break;

      case 'removeEntry':
        result = { success: indexer.removeEntry(payload as string) };
        break;

      case 'getEntry':
        result = indexer.getEntry(payload as string);
        break;

      case 'search':
        result = indexer.search(
          (payload as { query: string; limit?: number }).query,
          (payload as { query: string; limit?: number }).limit
        );
        break;

      case 'getStats':
        result = indexer.getStats();
        break;

      case 'clear':
        indexer.clear();
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      success: true,
      data: result,
      id,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
    };

    self.postMessage(response);
  }
});

// Export for testing
export { Indexer };

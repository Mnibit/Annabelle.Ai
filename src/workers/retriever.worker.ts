/**
 * Retriever Worker
 * Memory-efficient search and retrieval in a Web Worker
 */

import type { SearchQuery, SearchResult, WorkerMessage, WorkerResponse } from '../types';
import { MemoryMonitor } from '../utils/memory';

class Retriever {
  private cache: Map<string, SearchResult[]>;
  private memoryMonitor: MemoryMonitor;
  private maxCacheSize: number;

  constructor() {
    this.cache = new Map();
    this.memoryMonitor = new MemoryMonitor(256); // 256MB limit for retriever
    this.maxCacheSize = 100;
  }

  /**
   * Search with caching
   */
  async search(query: SearchQuery, dataSource: SearchResult[]): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(query);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit for query:', query.query);
      return this.cache.get(cacheKey)!;
    }

    // Perform search
    const results = this.performSearch(query, dataSource);

    // Cache results if not memory critical
    if (!this.memoryMonitor.isMemoryCritical()) {
      this.addToCache(cacheKey, results);
    }

    return results;
  }

  /**
   * Perform actual search operation
   */
  private performSearch(query: SearchQuery, dataSource: SearchResult[]): SearchResult[] {
    const lowerQuery = query.query.toLowerCase();
    const limit = query.limit || 10;

    let results = dataSource.filter((item) => {
      // Content matching
      const contentMatch = item.content.toLowerCase().includes(lowerQuery);

      // Filter matching
      if (query.filters && Object.keys(query.filters).length > 0) {
        const filterMatch = Object.entries(query.filters).every(([key, value]) => {
          return item.metadata[key] === value;
        });
        return contentMatch && filterMatch;
      }

      return contentMatch;
    });

    // Calculate relevance scores (simple frequency-based)
    results = results.map((item) => ({
      ...item,
      score: this.calculateScore(item.content, lowerQuery),
    }));

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(content: string, query: string): number {
    const lowerContent = content.toLowerCase();
    const occurrences = (lowerContent.match(new RegExp(query, 'g')) || []).length;
    const position = lowerContent.indexOf(query);

    // Score based on frequency and position
    let score = occurrences * 10;
    if (position !== -1) {
      score += Math.max(0, 100 - position);
    }

    return score;
  }

  /**
   * Generate cache key from query
   */
  private getCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      q: query.query,
      l: query.limit || 10,
      f: query.filters || {},
    });
  }

  /**
   * Add results to cache
   */
  private addToCache(key: string, results: SearchResult[]): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, results);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage: this.memoryMonitor.getMemoryUsage(),
    };
  }
}

// Initialize retriever instance
const retriever = new Retriever();

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case 'search':
        result = await retriever.search(
          (payload as { query: SearchQuery; dataSource: SearchResult[] }).query,
          (payload as { query: SearchQuery; dataSource: SearchResult[] }).dataSource
        );
        break;

      case 'clearCache':
        retriever.clearCache();
        result = { success: true };
        break;

      case 'getCacheStats':
        result = retriever.getCacheStats();
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
export { Retriever };

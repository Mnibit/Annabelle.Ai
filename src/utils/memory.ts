/**
 * Memory Management Utilities
 * Optimized for devices with ~2GB RAM
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

export class MemoryMonitor {
  private maxMemoryMB: number;
  private warningThreshold: number;

  constructor(maxMemoryMB = 512, warningThreshold = 0.8) {
    this.maxMemoryMB = maxMemoryMB;
    this.warningThreshold = warningThreshold;
  }

  /**
   * Get current memory usage estimate
   */
  getMemoryUsage(): number {
    const perf = performance as PerformanceWithMemory;
    if ('memory' in performance && perf.memory) {
      const memInfo = perf.memory;
      return memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * Check if memory usage is critical
   */
  isMemoryCritical(): boolean {
    const usage = this.getMemoryUsage();
    return usage > this.maxMemoryMB * this.warningThreshold;
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const perf = performance as PerformanceWithMemory;
    if ('memory' in performance && perf.memory) {
      const memInfo = perf.memory;
      return {
        used: memInfo.usedJSHeapSize / (1024 * 1024),
        total: memInfo.totalJSHeapSize / (1024 * 1024),
        limit: memInfo.jsHeapSizeLimit / (1024 * 1024),
      };
    }
    return null;
  }
}

/**
 * Batch processor for memory-efficient operations
 */
export class BatchProcessor<T> {
  private batchSize: number;

  constructor(batchSize = 100) {
    this.batchSize = batchSize;
  }

  /**
   * Process items in batches to avoid memory spikes
   */
  async *processBatches(
    items: T[],
    processor: (batch: T[]) => Promise<void>
  ): AsyncGenerator<number> {
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      await processor(batch);
      yield i + batch.length;
    }
  }
}

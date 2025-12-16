/**
 * Memory Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { MemoryMonitor, BatchProcessor } from '../utils/memory';

describe('MemoryMonitor', () => {
  it('should create instance with default values', () => {
    const monitor = new MemoryMonitor();
    expect(monitor).toBeDefined();
  });

  it('should create instance with custom values', () => {
    const monitor = new MemoryMonitor(1024, 0.9);
    expect(monitor).toBeDefined();
  });

  it('should get memory usage', () => {
    const monitor = new MemoryMonitor();
    const usage = monitor.getMemoryUsage();
    expect(typeof usage).toBe('number');
    expect(usage).toBeGreaterThanOrEqual(0);
  });

  it('should check if memory is critical', () => {
    const monitor = new MemoryMonitor();
    const isCritical = monitor.isMemoryCritical();
    expect(typeof isCritical).toBe('boolean');
  });
});

describe('BatchProcessor', () => {
  it('should create instance with default batch size', () => {
    const processor = new BatchProcessor();
    expect(processor).toBeDefined();
  });

  it('should create instance with custom batch size', () => {
    const processor = new BatchProcessor(50);
    expect(processor).toBeDefined();
  });

  it('should process items in batches', async () => {
    const processor = new BatchProcessor<number>(10);
    const items = Array.from({ length: 25 }, (_, i) => i);
    const processedBatches: number[][] = [];

    const iterator = processor.processBatches(items, async (batch) => {
      processedBatches.push([...batch]);
    });

    const progress: number[] = [];
    for await (const p of iterator) {
      progress.push(p);
    }

    expect(processedBatches).toHaveLength(3);
    expect(processedBatches[0]).toHaveLength(10);
    expect(processedBatches[1]).toHaveLength(10);
    expect(processedBatches[2]).toHaveLength(5);
    expect(progress).toEqual([10, 20, 25]);
  });
});

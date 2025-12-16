/**
 * AnnabelleAI Core
 * Main API for interacting with the indexer and retriever workers
 */

import type {
  IndexEntry,
  SearchQuery,
  SearchResult,
  IndexStats,
  WorkerMessage,
  WorkerResponse,
} from '../types';

export class AnnabelleAI {
  private indexerWorker: Worker | null = null;
  private retrieverWorker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<string, (response: WorkerResponse) => void>();

  /**
   * Initialize the workers
   */
  async initialize(): Promise<void> {
    try {
      // Create workers
      this.indexerWorker = new Worker(
        new URL('../workers/indexer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.retrieverWorker = new Worker(
        new URL('../workers/retriever.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handlers
      this.indexerWorker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.retrieverWorker.addEventListener('message', this.handleWorkerMessage.bind(this));

      console.log('Annabelle.AI workers initialized');
    } catch (error) {
      console.error('Failed to initialize workers:', error);
      throw error;
    }
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    if (response.id) {
      const resolver = this.pendingMessages.get(response.id);
      if (resolver) {
        resolver(response);
        this.pendingMessages.delete(response.id);
      }
    }
  }

  /**
   * Send message to worker and wait for response
   */
  private async sendToWorker(
    worker: Worker,
    type: string,
    payload?: unknown
  ): Promise<WorkerResponse> {
    const id = `msg-${this.messageId++}`;

    return new Promise((resolve) => {
      this.pendingMessages.set(id, resolve);

      const message: WorkerMessage = {
        type,
        payload,
        id,
      };

      worker.postMessage(message);
    });
  }

  /**
   * Add a single entry to the index
   */
  async addEntry(entry: IndexEntry): Promise<void> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'addEntry', entry);

    if (!response.success) {
      throw new Error(response.error || 'Failed to add entry');
    }
  }

  /**
   * Add multiple entries to the index
   */
  async addEntries(entries: IndexEntry[]): Promise<void> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'addEntries', entries);

    if (!response.success) {
      throw new Error(response.error || 'Failed to add entries');
    }
  }

  /**
   * Remove an entry from the index
   */
  async removeEntry(id: string): Promise<boolean> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'removeEntry', id);

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove entry');
    }

    return response.data as boolean;
  }

  /**
   * Get an entry by ID
   */
  async getEntry(id: string): Promise<IndexEntry | undefined> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'getEntry', id);

    if (!response.success) {
      throw new Error(response.error || 'Failed to get entry');
    }

    return response.data as IndexEntry | undefined;
  }

  /**
   * Search in the index
   */
  async search(query: string, limit = 10): Promise<IndexEntry[]> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'search', {
      query,
      limit,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to search');
    }

    return response.data as IndexEntry[];
  }

  /**
   * Advanced search with retriever
   */
  async advancedSearch(query: SearchQuery, dataSource: SearchResult[]): Promise<SearchResult[]> {
    if (!this.retrieverWorker) {
      throw new Error('Retriever worker not initialized');
    }

    const response = await this.sendToWorker(this.retrieverWorker, 'search', {
      query,
      dataSource,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to perform advanced search');
    }

    return response.data as SearchResult[];
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<IndexStats> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'getStats');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get stats');
    }

    return response.data as IndexStats;
  }

  /**
   * Clear the index
   */
  async clear(): Promise<void> {
    if (!this.indexerWorker) {
      throw new Error('Indexer worker not initialized');
    }

    const response = await this.sendToWorker(this.indexerWorker, 'clear');

    if (!response.success) {
      throw new Error(response.error || 'Failed to clear index');
    }
  }

  /**
   * Clear retriever cache
   */
  async clearCache(): Promise<void> {
    if (!this.retrieverWorker) {
      throw new Error('Retriever worker not initialized');
    }

    const response = await this.sendToWorker(this.retrieverWorker, 'clearCache');

    if (!response.success) {
      throw new Error(response.error || 'Failed to clear cache');
    }
  }

  /**
   * Terminate workers
   */
  terminate(): void {
    if (this.indexerWorker) {
      this.indexerWorker.terminate();
      this.indexerWorker = null;
    }

    if (this.retrieverWorker) {
      this.retrieverWorker.terminate();
      this.retrieverWorker = null;
    }

    this.pendingMessages.clear();
    console.log('Annabelle.AI workers terminated');
  }
}

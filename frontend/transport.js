/**
 * transport.js - Worker Transport Helpers
 * Request/Response pattern with timeout & compression support
 */

/**
 * Create a Worker Bridge for request/response communication
 * @param {Worker} worker - The web worker instance
 * @returns {Object} Bridge object with sendWithResponse method
 */
export function createWorkerBridge(worker) {
    let idCounter = 1;
    const pending = new Map();

    // Handle messages from worker
    worker.onmessage = (ev) => {
        const {id, ok, result, error} = ev.data || {};
        if (!id) return;
        
        const p = pending.get(id);
        if (!p) return;
        
        pending.delete(id);
        
        if (ok) {
            p.resolve(result);
        } else {
            p.reject(new Error(error || 'Worker error'));
        }
    };

    // Handle worker errors
    worker.onerror = (err) => {
        console.error('Worker error:', err);
        // Reject all pending requests
        for (const [id, p] of pending.entries()) {
            p.reject(new Error('Worker crashed'));
            pending.delete(id);
        }
    };

    return {
        /**
         * Send a message to worker and wait for response
         * @param {string} action - Action to perform
         * @param {*} payload - Payload data
         * @param {Object} opts - Options
         * @param {number} opts.timeout - Timeout in ms (default: 30000)
         * @param {boolean} opts.compress - Whether to compress payload (default: false)
         * @returns {Promise} Promise that resolves with worker response
         */
        sendWithResponse(action, payload = {}, {timeout = 30000, compress = false} = {}) {
            return new Promise((resolve, reject) => {
                const id = String(idCounter++);
                
                // Set up timeout
                const timer = setTimeout(() => {
                    pending.delete(id);
                    reject(new Error(`Worker timeout after ${timeout}ms`));
                }, timeout);

                // Store resolver/rejecter with timeout clearing
                pending.set(id, {
                    resolve: (r) => {
                        clearTimeout(timer);
                        resolve(r);
                    },
                    reject: (e) => {
                        clearTimeout(timer);
                        reject(e);
                    }
                });

                // Construct message
                const message = {
                    id,
                    action,
                    payload,
                    meta: {
                        ts: Date.now()
                    }
                };

                // Optional compression using pako
                if (compress && self.pako) {
                    try {
                        message.payload = pako.deflate(JSON.stringify(payload));
                        message.compressed = true;
                    } catch (e) {
                        pending.delete(id);
                        clearTimeout(timer);
                        reject(new Error('Compression failed: ' + e.message));
                        return;
                    }
                }

                // Send to worker
                worker.postMessage(message);
            });
        },

        /**
         * Terminate the worker
         */
        terminate() {
            worker.terminate();
            pending.clear();
        },

        /**
         * Get number of pending requests
         */
        getPendingCount() {
            return pending.size;
        }
    };
}

/**
 * Create multiple worker bridges for a worker pool
 * @param {string} workerUrl - URL to worker script
 * @param {number} poolSize - Number of workers in pool
 * @returns {Object} Pool object with methods for load balancing
 */
export function createWorkerPool(workerUrl, poolSize = 4) {
    const workers = [];
    const bridges = [];

    // Create workers
    for (let i = 0; i < poolSize; i++) {
        const worker = new Worker(workerUrl);
        const bridge = createWorkerBridge(worker);
        workers.push(worker);
        bridges.push(bridge);
    }

    let nextWorkerIndex = 0;

    return {
        /**
         * Send request to next available worker (round-robin)
         */
        sendWithResponse(action, payload, opts) {
            const bridge = bridges[nextWorkerIndex];
            nextWorkerIndex = (nextWorkerIndex + 1) % poolSize;
            return bridge.sendWithResponse(action, payload, opts);
        },

        /**
         * Send request to least busy worker
         */
        sendWithResponseLeastBusy(action, payload, opts) {
            let leastBusyBridge = bridges[0];
            let minPending = leastBusyBridge.getPendingCount();

            for (let i = 1; i < bridges.length; i++) {
                const pending = bridges[i].getPendingCount();
                if (pending < minPending) {
                    minPending = pending;
                    leastBusyBridge = bridges[i];
                }
            }

            return leastBusyBridge.sendWithResponse(action, payload, opts);
        },

        /**
         * Broadcast to all workers
         */
        broadcast(action, payload) {
            return Promise.all(
                bridges.map(bridge => bridge.sendWithResponse(action, payload))
            );
        },

        /**
         * Terminate all workers
         */
        terminate() {
            bridges.forEach(bridge => bridge.terminate());
            workers.length = 0;
            bridges.length = 0;
        },

        /**
         * Get pool statistics
         */
        getStats() {
            return {
                poolSize,
                totalPending: bridges.reduce((sum, b) => sum + b.getPendingCount(), 0),
                workers: bridges.map(b => ({pending: b.getPendingCount()}))
            };
        }
    };
}

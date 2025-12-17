/**
 * Indexer Worker - worker_indexer.js
 * Handles batch indexing with TF vectorization and compression support
 */

// Import pako if available for compression
// Note: In production, ensure pako is loaded before worker initialization
// importScripts('https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js');

// Deutsche Stoppwörter (German stopwords)
const stopwords = new Set([
    'und', 'der', 'die', 'das', 'ein', 'eine', 'ist', 'zu', 'in', 'den',
    'dem', 'des', 'im', 'auf', 'für', 'mit', 'von', 'als', 'auch', 'an',
    'sich', 'bei', 'nicht', 'oder', 'es', 'wird', 'wurde', 'kann', 'so',
    'nach', 'sind', 'wie', 'aus', 'wenn', 'nur', 'war', 'noch', 'mehr',
    'werden', 'hat', 'aber', 'über', 'bis', 'durch', 'werden', 'sein'
]);

/**
 * Tokenize text into words (Unicode-aware)
 * @param {string} text - Input text
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    // Match Unicode letters
    return text.toLowerCase().match(/\p{L}+/gu) || [];
}

/**
 * Vectorize text using TF (Term Frequency)
 * @param {string} text - Input text
 * @param {string[]} attentionTerms - Terms to prioritize
 * @returns {Object} Vector with tf, len, and score
 */
function vectorize(text, attentionTerms = []) {
    const tokens = tokenize(text).filter(t => !stopwords.has(t));
    const tf = {};
    
    tokens.forEach(t => {
        tf[t] = (tf[t] || 0) + 1;
    });

    // Calculate attention score
    const score = attentionTerms.reduce((s, term) => {
        return s + (tf[term.toLowerCase()] || 0);
    }, 0);

    return {
        tf,
        len: tokens.length,
        score
    };
}

/**
 * Process index batch
 * @param {Array} batch - Array of atoms to index
 * @param {Array} attentionTerms - Terms to prioritize
 * @returns {Array} Indexed results with vectors
 */
function indexBatch(batch, attentionTerms = []) {
    if (!Array.isArray(batch)) {
        throw new Error('Batch must be an array');
    }

    const results = batch.map(atom => {
        if (!atom || !atom.id || !atom.d) {
            return {id: atom?.id || 'unknown', vec: null, error: 'Invalid atom'};
        }

        try {
            const vec = vectorize(atom.d, attentionTerms);
            return {
                id: atom.id,
                vec,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                id: atom.id,
                vec: null,
                error: String(error)
            };
        }
    });

    return results;
}

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (ev) => {
    const {id, action, payload, compressed} = ev.data;

    try {
        // Decompress payload if needed
        let data = payload;
        if (compressed && self.pako) {
            try {
                const decompressed = pako.inflate(payload, {to: 'string'});
                data = JSON.parse(decompressed);
            } catch (e) {
                self.postMessage({
                    id,
                    ok: false,
                    error: 'Decompression failed: ' + String(e)
                });
                return;
            }
        }

        let result;

        switch (action) {
            case 'indexBatch':
                if (!data || !data.batch) {
                    throw new Error('Missing batch in payload');
                }
                result = indexBatch(data.batch, data.attentionTerms || []);
                break;

            case 'vectorize':
                if (!data || !data.text) {
                    throw new Error('Missing text in payload');
                }
                result = vectorize(data.text, data.attentionTerms || []);
                break;

            case 'ping':
                result = {pong: true, timestamp: Date.now()};
                break;

            default:
                throw new Error('Unknown action: ' + action);
        }

        // Send success response
        self.postMessage({
            id,
            ok: true,
            result
        });

    } catch (err) {
        // Send error response
        self.postMessage({
            id,
            ok: false,
            error: String(err)
        });
    }
};

// Signal that worker is ready
console.log('Indexer worker initialized');

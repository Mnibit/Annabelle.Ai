/**
 * backend_index.js - Annabelle Backend with Lifesync API
 * Node/Express server with RSA JWT signing and SQLite storage
 */

import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8443;
const ISSUER = 'annabelle-server';
const RATE_LIMIT = 60; // requests per window
const WINDOW_MS = 60_000; // 1 minute

// Middleware
app.use(cors());
app.use(express.json({limit: '1mb'}));

// Load RSA keys
let PRIVATE_KEY;
let PUBLIC_KEY;

try {
    PRIVATE_KEY = fs.readFileSync('./keys/private.pem', 'utf8');
    PUBLIC_KEY = fs.readFileSync('./keys/public.pem', 'utf8');
    console.log('✓ RSA keys loaded successfully');
} catch (error) {
    console.error('✗ Failed to load RSA keys. Please generate them first:');
    console.error('  openssl genrsa -out keys/private.pem 2048');
    console.error('  openssl rsa -in keys/private.pem -pubout -out keys/public.pem');
    process.exit(1);
}

// Initialize SQLite database
const db = new sqlite3.Database('./data/lifesync.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('✓ Connected to SQLite database');
});

// Create tables
db.run(`
    CREATE TABLE IF NOT EXISTS sync (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        payloadHash TEXT NOT NULL,
        created INTEGER NOT NULL,
        meta TEXT
    )
`, (err) => {
    if (err) {
        console.error('Table creation error:', err);
    } else {
        console.log('✓ Database tables ready');
    }
});

// Simple in-memory rate limiter (for PoC)
// In production, use Redis or similar
const rateMap = new Map(); // source -> {count, windowStart}

/**
 * Check rate limit for a source
 * @param {string} source - Source identifier
 * @returns {boolean} True if within limit
 */
function checkRate(source) {
    const now = Date.now();
    const s = rateMap.get(source) || {count: 0, windowStart: now};
    
    // Reset window if expired
    if (now - s.windowStart > WINDOW_MS) {
        s.count = 0;
        s.windowStart = now;
    }
    
    s.count += 1;
    rateMap.set(source, s);
    
    return s.count <= RATE_LIMIT;
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [source, data] of rateMap.entries()) {
        if (now - data.windowStart > WINDOW_MS * 2) {
            rateMap.delete(source);
        }
    }
}, WINDOW_MS);

/**
 * POST /api/lifesync
 * Main Lifesync endpoint for storing and signing payloads
 */
app.post('/api/lifesync', async (req, res) => {
    try {
        const {source, payload, meta} = req.body || {};

        // Validation
        if (!source || typeof source !== 'string' || !source.trim()) {
            return res.status(400).json({error: 'Invalid source'});
        }

        if (!payload) {
            return res.status(400).json({error: 'Missing payload'});
        }

        // Rate limiting
        if (!checkRate(source)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Maximum ${RATE_LIMIT} requests per minute`
            });
        }

        // Convert payload to string for hashing
        const payloadStr = typeof payload === 'string' 
            ? payload 
            : JSON.stringify(payload);

        // Create SHA256 hash of payload
        const hash = crypto.createHash('sha256')
            .update(payloadStr)
            .digest('hex');

        // Generate unique ID
        const id = crypto.randomUUID?.() || 
            `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Create JWT with RSA signature
        const token = jwt.sign(
            {
                payloadHash: hash,
                source,
                id
            },
            PRIVATE_KEY,
            {
                algorithm: 'RS256',
                issuer: ISSUER,
                expiresIn: '1h'
            }
        );

        // Store in database
        const metaStr = meta ? JSON.stringify(meta) : null;
        
        db.run(
            'INSERT INTO sync(id, source, payloadHash, created, meta) VALUES(?,?,?,?,?)',
            [id, source, hash, Date.now(), metaStr],
            (err) => {
                if (err) {
                    console.error('Database insert error:', err);
                }
            }
        );

        // Return response
        return res.json({
            id,
            signedToken: token,
            hash,
            timestamp: Date.now()
        });

    } catch (err) {
        console.error('Lifesync error:', err);
        return res.status(500).json({error: 'Server error'});
    }
});

/**
 * GET /api/verify/:id
 * Verify a sync entry exists
 */
app.get('/api/verify/:id', (req, res) => {
    const {id} = req.params;

    db.get(
        'SELECT id, source, created FROM sync WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({error: 'Database error'});
            }

            if (!row) {
                return res.status(404).json({error: 'Not found'});
            }

            return res.json({
                exists: true,
                id: row.id,
                source: row.source,
                created: row.created
            });
        }
    );
});

/**
 * POST /api/verify-token
 * Verify a JWT token
 */
app.post('/api/verify-token', (req, res) => {
    const {token} = req.body || {};

    if (!token) {
        return res.status(400).json({error: 'Missing token'});
    }

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, {
            algorithms: ['RS256'],
            issuer: ISSUER
        });

        return res.json({
            valid: true,
            decoded
        });
    } catch (err) {
        return res.status(401).json({
            valid: false,
            error: err.message
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM sync', (err, row) => {
        const syncCount = err ? null : row.count;

        res.json({
            status: 'ok',
            service: 'annabelle-backend',
            timestamp: new Date().toISOString(),
            syncCount,
            rateLimit: {
                limit: RATE_LIMIT,
                window: `${WINDOW_MS / 1000}s`
            }
        });
    });
});

/**
 * GET /stats
 * Statistics endpoint
 */
app.get('/stats', (req, res) => {
    db.all(
        'SELECT source, COUNT(*) as count FROM sync GROUP BY source',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({error: 'Database error'});
            }

            const total = rows.reduce((sum, r) => sum + r.count, 0);

            res.json({
                total,
                bySource: rows,
                timestamp: Date.now()
            });
        }
    );
});

/**
 * Start server
 */
app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Annabelle Backend - Lifesync API    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  POST /api/lifesync        - Sync and sign data`);
    console.log(`  GET  /api/verify/:id      - Verify sync entry`);
    console.log(`  POST /api/verify-token    - Verify JWT token`);
    console.log(`  GET  /health              - Health check`);
    console.log(`  GET  /stats               - Statistics`);
    console.log('');
    console.log(`Rate limit: ${RATE_LIMIT} requests per ${WINDOW_MS / 1000}s`);
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        process.exit(err ? 1 : 0);
    });
});

import crypto from 'crypto';
import { env } from '../config/env.js';
import { getDbPool } from '../db/client.js';
import { TenantContext } from '../db/schema.js';

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generate a secure ExtenGen API key (e.g. ext_live_abc123...)
 */
export function generateApiKey(prefix: 'live' | 'test' = 'live'): GeneratedApiKey {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `ext_${prefix}_${randomBytes}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Hash an API key with SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Resolve an authorization token or API key header into a verified TenantContext
 */
export async function resolveAuthContext(authHeader?: string): Promise<TenantContext> {
  // If no auth header provided, check if we have default org/user configured (e.g. local CLI mode)
  if (!authHeader) {
    return {
      orgId: env.DEFAULT_ORG_ID,
      userId: env.DEFAULT_USER_ID,
      role: 'agent',
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Check for standard ExtenGen API Key
  if (token.startsWith('ext_')) {
    const keyHash = hashApiKey(token);
    const pool = getDbPool();

    if (pool) {
      try {
        const result = await pool.query(
          `SELECT org_id, user_id FROM api_keys WHERE key_hash = $1 LIMIT 1`,
          [keyHash]
        );

        if (result.rows.length > 0) {
          // Update last_used_at asynchronously
          pool.query(`UPDATE api_keys SET last_used_at = now() WHERE key_hash = $1`, [keyHash]).catch(() => {});

          return {
            orgId: result.rows[0].org_id,
            userId: result.rows[0].user_id,
            role: 'member',
          };
        }
      } catch (err) {
        console.error('Error querying api_key from database:', err);
      }
    }

    // Key was not found in database or invalid
    throw Object.assign(new Error('Invalid API key'), { statusCode: 401 });
  }

  // 2. Direct format for tests only: `org_uuid[:user_id]`
  if (env.NODE_ENV === 'test') {
    const parts = token.split(':');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[0]);
    if (isUuid || (parts.length === 2 && parts[0].length >= 8)) {
      return {
        orgId: parts[0],
        userId: parts[1] || null,
        role: 'member',
      };
    }
  }

  // Any other non-empty header token that is invalid must be rejected with 401
  throw Object.assign(new Error('Invalid authorization token'), { statusCode: 401 });
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const pool = getDbPool();
  if (!pool) {
    console.warn('⚠️ No DATABASE_URL provided, skipping database migrations.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('🚀 Running database migrations...');
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found at ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Executing migration: ${file}...`);
      await client.query(sql);
      console.log(`✅ Applied migration: ${file}`);
    }

    // Ensure default organization and user exist for unauthenticated / local agent mode
    await client.query(`
      INSERT INTO organizations (id, name, slug)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workspace', 'default')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO users (id, org_id, email, name, role)
      VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'agent@default.local', 'Default Agent', 'agent')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('🎉 All migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

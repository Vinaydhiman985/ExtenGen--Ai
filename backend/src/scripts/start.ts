import { runMigrations } from '../db/migrate.js';

await runMigrations();
await import('../index.js');

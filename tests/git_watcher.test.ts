import { describe, expect, it } from 'vitest';
import { getSummarizableFiles, redactSensitiveDiff } from '../src/services/gitWatcher.js';

describe('Git commit watcher helpers', () => {
  it('only includes supported source and documentation files', () => {
    expect(getSummarizableFiles([
      'src/api.ts',
      'docs/architecture.md',
      '.env',
      'config/service.pem',
      'node_modules/library/index.js',
      'package-lock.json',
      'dist/index.js',
      'assets/logo.png',
    ])).toEqual([
      'src/api.ts',
      'docs/architecture.md',
    ]);
  });

  it('redacts common inline credentials and PEM private keys from diffs', () => {
    const diff = [
      '+api_key = "ghp_examplecredentialvalue123"',
      '+password: supersecretvalue123',
      '+-----BEGIN PRIVATE KEY-----',
      '+private-key-material',
      '+-----END PRIVATE KEY-----',
    ].join('\n');

    const redacted = redactSensitiveDiff(diff);
    expect(redacted).not.toContain('ghp_examplecredentialvalue123');
    expect(redacted).not.toContain('supersecretvalue123');
    expect(redacted).not.toContain('private-key-material');
    expect(redacted.match(/\[REDACTED/g)).toHaveLength(3);
  });
});

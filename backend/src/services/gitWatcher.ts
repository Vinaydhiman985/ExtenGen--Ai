const SUMMARIZABLE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.cpp',
  '.cs',
  '.css',
  '.go',
  '.html',
  '.java',
  '.js',
  '.jsx',
  '.md',
  '.mjs',
  '.php',
  '.py',
  '.rb',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.svelte',
  '.swift',
  '.toml',
  '.ts',
  '.tsx',
  '.vue',
  '.xml',
  '.yaml',
  '.yml',
]);

const EXCLUDED_PATH = /(^|\/)(?:\.env(?:\..*)?|node_modules|\.git|dist|coverage|vendor)(?:\/|$)|(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|[^/]*\.(?:pem|key|p12|pfx|crt|cer))$/i;

export function getSummarizableFiles(paths: string[]): string[] {
  return paths.filter((path) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const filename = normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1);
    const extension = filename.includes('.')
      ? filename.slice(filename.lastIndexOf('.')).toLowerCase()
      : '';

    return !EXCLUDED_PATH.test(normalizedPath)
      && SUMMARIZABLE_EXTENSIONS.has(extension);
  });
}

export function redactSensitiveDiff(diff: string): string {
  return diff
    .replace(
      /((?:api[_-]?key|secret|password|token|credential|private[_-]?key)(?:\s*[:=]\s*|\s+))(["']?)[^\s"'`,;]{8,}\2/gi,
      '$1[REDACTED]'
    )
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      '[REDACTED PRIVATE KEY]'
    );
}

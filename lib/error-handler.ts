import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.resolve(__dirname, '../logs');
const ERROR_LOG = path.join(LOG_DIR, 'errors.log');

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function logError(context: string, error: unknown): void {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.stack || error.message : String(error);
  const entry = `[${timestamp}] ${context}: ${message}\n`;
  fs.appendFileSync(ERROR_LOG, entry);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 1, delayMs = 5000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

export function readFileWithFallback(filePath: string, defaultContent: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    logError(`readFileWithFallback(${filePath})`, err);
    return defaultContent;
  }
}

export function writeFileWithRetry(filePath: string, content: string): boolean {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (err) {
      if (attempt === 1) {
        logError(`writeFileWithRetry(${filePath})`, err);
        return false;
      }
    }
  }
  return false;
}

export function setupGlobalErrorHandler(): void {
  process.on('uncaughtException', (err) => {
    logError('uncaughtException', err);
  });
  process.on('unhandledRejection', (reason) => {
    logError('unhandledRejection', reason);
  });
}

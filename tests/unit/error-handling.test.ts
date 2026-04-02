import * as fs from 'fs';
import * as path from 'path';
import {
  withRetry,
  readFileWithFallback,
  writeFileWithRetry,
  logError,
  setupGlobalErrorHandler,
} from '../../lib/error-handler';

// Use a temp directory for test artifacts
const TEST_TMP = path.resolve(__dirname, '../../.test-tmp');
const TEST_LOG_DIR = path.resolve(__dirname, '../../logs');
const TEST_ERROR_LOG = path.join(TEST_LOG_DIR, 'errors.log');

beforeEach(() => {
  // Clean up test artifacts
  if (fs.existsSync(TEST_TMP)) {
    fs.rmSync(TEST_TMP, { recursive: true });
  }
  fs.mkdirSync(TEST_TMP, { recursive: true });

  // Clear the error log before each test
  if (fs.existsSync(TEST_ERROR_LOG)) {
    fs.unlinkSync(TEST_ERROR_LOG);
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_TMP)) {
    fs.rmSync(TEST_TMP, { recursive: true });
  }
});

describe('withRetry', () => {
  test('succeeds on second attempt after first failure', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('transient failure');
      }
      return 'success';
    };

    const result = await withRetry(fn, { maxRetries: 1, delayMs: 10 });
    expect(result).toBe('success');
    expect(callCount).toBe(2);
  });

  test('throws after exhausting retries', async () => {
    const fn = async () => {
      throw new Error('persistent failure');
    };

    await expect(withRetry(fn, { maxRetries: 2, delayMs: 10 })).rejects.toThrow(
      'persistent failure'
    );
  });

  test('returns immediately on first success without retrying', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return 42;
    };

    const result = await withRetry(fn, { maxRetries: 3, delayMs: 10 });
    expect(result).toBe(42);
    expect(callCount).toBe(1);
  });
});

describe('readFileWithFallback', () => {
  test('returns file content when file exists', () => {
    const filePath = path.join(TEST_TMP, 'existing.txt');
    fs.writeFileSync(filePath, 'hello world', 'utf-8');

    const result = readFileWithFallback(filePath, 'default');
    expect(result).toBe('hello world');
  });

  test('returns default content when file does not exist', () => {
    const filePath = path.join(TEST_TMP, 'nonexistent.txt');

    const result = readFileWithFallback(filePath, 'fallback content');
    expect(result).toBe('fallback content');
  });

  test('logs error when file does not exist', () => {
    const filePath = path.join(TEST_TMP, 'missing.txt');

    readFileWithFallback(filePath, 'default');

    expect(fs.existsSync(TEST_ERROR_LOG)).toBe(true);
    const logContent = fs.readFileSync(TEST_ERROR_LOG, 'utf-8');
    expect(logContent).toContain('readFileWithFallback');
    expect(logContent).toContain('missing.txt');
  });
});

describe('writeFileWithRetry', () => {
  test('returns true on successful write', () => {
    const filePath = path.join(TEST_TMP, 'output.txt');

    const result = writeFileWithRetry(filePath, 'test content');
    expect(result).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('test content');
  });

  test('creates parent directories if they do not exist', () => {
    const filePath = path.join(TEST_TMP, 'nested', 'dir', 'file.txt');

    const result = writeFileWithRetry(filePath, 'nested content');
    expect(result).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('nested content');
  });

  test('returns false after 2 failures and logs error', () => {
    // Use an invalid path that will fail on write (directory as file)
    const dirPath = path.join(TEST_TMP, 'blocker');
    fs.mkdirSync(dirPath, { recursive: true });
    // Try to write to the directory itself (not a file inside it)
    const filePath = dirPath;

    const result = writeFileWithRetry(filePath, 'will fail');
    expect(result).toBe(false);

    // Verify error was logged
    expect(fs.existsSync(TEST_ERROR_LOG)).toBe(true);
    const logContent = fs.readFileSync(TEST_ERROR_LOG, 'utf-8');
    expect(logContent).toContain('writeFileWithRetry');
  });
});

describe('logError', () => {
  test('creates log directory and writes error entry', () => {
    logError('test-context', new Error('test error message'));

    expect(fs.existsSync(TEST_ERROR_LOG)).toBe(true);
    const logContent = fs.readFileSync(TEST_ERROR_LOG, 'utf-8');
    expect(logContent).toContain('test-context');
    expect(logContent).toContain('test error message');
  });

  test('includes timestamp in ISO format', () => {
    logError('timestamp-test', new Error('check timestamp'));

    const logContent = fs.readFileSync(TEST_ERROR_LOG, 'utf-8');
    // ISO timestamp pattern: YYYY-MM-DDTHH:MM:SS
    expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('handles non-Error objects', () => {
    logError('string-error', 'plain string error');

    const logContent = fs.readFileSync(TEST_ERROR_LOG, 'utf-8');
    expect(logContent).toContain('plain string error');
  });
});

describe('setupGlobalErrorHandler', () => {
  test('registers handlers for uncaughtException and unhandledRejection', () => {
    const originalListenerCounts = {
      uncaughtException: process.listenerCount('uncaughtException'),
      unhandledRejection: process.listenerCount('unhandledRejection'),
    };

    setupGlobalErrorHandler();

    expect(process.listenerCount('uncaughtException')).toBe(
      originalListenerCounts.uncaughtException + 1
    );
    expect(process.listenerCount('unhandledRejection')).toBe(
      originalListenerCounts.unhandledRejection + 1
    );

    // Clean up: remove the listeners we just added
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
  });
});

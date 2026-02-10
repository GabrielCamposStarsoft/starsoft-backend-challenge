import { existsSync } from 'node:fs';
import { join as joinPath } from 'node:path';

/**
 * Resolves the i18n root path (folder containing en/, pt/, etc.).
 * Uses dist/i18n when it exists (production/Docker); otherwise src/i18n (development).
 */
export const getI18nPath = (): string => {
  const cwd: string = process.cwd();
  const distPath: string = joinPath(cwd, 'dist', 'i18n');
  if (existsSync(distPath)) {
    return distPath;
  }
  return joinPath(cwd, 'src', 'i18n');
};

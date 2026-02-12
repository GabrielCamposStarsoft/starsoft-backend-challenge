/**
 * @fileoverview i18n translation root path resolver.
 *
 * Resolves to dist/i18n when built, src/i18n when running from source.
 * Used by nestjs-i18n for loading translation files.
 *
 * @util i18n-path
 */

import { existsSync } from 'node:fs';
import { join as joinPath } from 'node:path';

/**
 * Root path for i18n translation files.
 *
 * @description Resolves to dist/i18n when built (production), src/i18n in development.
 * Folder contains language subfolders (en/, pt/, es/).
 *
 * @constant
 */
export const I18N_PATH: string = ((): string => {
  const cwd: string = process.cwd();
  const distPath: string = joinPath(cwd, 'dist', 'i18n');
  if (existsSync(distPath)) {
    return distPath;
  }
  return joinPath(cwd, 'src', 'i18n');
})();

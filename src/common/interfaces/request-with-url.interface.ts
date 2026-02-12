import type { Optional } from '../types';

/**
 * @fileoverview HTTP request shape with an optional URL property.
 *
 * Represents a minimal subset of an HTTP request containing only the URL.
 * Used for guards and utilities that operate on the request path or URL.
 *
 * @interface request-with-url
 */

/**
 * HTTP request contract optionally containing a URL.
 */
export interface IRequestWithUrl {
  /** The request path or URL, if available. */
  url?: Optional<string>;
}

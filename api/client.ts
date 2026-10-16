import createClient from 'openapi-fetch';
import type { paths } from './schema';

/** Typed HTTP methods, request bodies, success envelopes, and error responses. */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
export type { paths, components, operations } from './schema';

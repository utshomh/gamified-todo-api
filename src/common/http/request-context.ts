import type { Request } from 'express';

export type RequestWithMeta = Request & { requestId?: string };

import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiErrorResponseDto } from './api-error-response.dto';
import { ERROR_CATALOG, ErrorCode } from './error-catalog';
import { genericCodeForStatus } from './error.utils';

function groupByStatus(codes: readonly ErrorCode[]) {
  const groups = new Map<number, ErrorCode[]>();

  for (const code of codes) {
    const status = ERROR_CATALOG[code].status;
    const existing = groups.get(status) ?? [];

    existing.push(code);
    groups.set(status, existing);
  }

  return groups;
}

function schemaForError(code: ErrorCode) {
  const definition = ERROR_CATALOG[code];

  return {
    allOf: [
      {
        $ref: getSchemaPath(ApiErrorResponseDto),
      },
      {
        type: 'object',
        required: ['statusCode', 'code', 'message'],
        properties: {
          statusCode: {
            type: 'integer',
            enum: [definition.status],
          },
          code: {
            type: 'string',
            enum: [code],
          },
          message: {
            type: 'string',
            example: definition.status,
          },
          details: {},
        },
      },
    ],
  };
}

export function ApiErrors<const Codes extends readonly ErrorCode[]>(
  ...codes: Codes
) {
  const groups = groupByStatus(codes);

  const responseDecorators = [...groups.entries()].map(
    ([status, statusCodes]) =>
      ApiResponse({
        status,
        description: statusCodes
          .map((code) => ERROR_CATALOG[code].description)
          .join(' / '),

        content: {
          'application/json': {
            schema: {
              oneOf: statusCodes.map(schemaForError),
            },

            examples: Object.fromEntries(
              statusCodes.map((code) => {
                const definition = ERROR_CATALOG[code];

                return [
                  code,
                  {
                    summary: genericCodeForStatus(definition.status),
                    value: {
                      statusCode: definition.status,
                      code,
                      message: definition.message,
                      timestamp: '2026-08-06T00:00:00.000Z',
                      path: '/api/v1/example',
                      details: {},
                    },
                  },
                ];
              }),
            ),
          },
        },
      }),
  );

  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ...responseDecorators,
  );
}

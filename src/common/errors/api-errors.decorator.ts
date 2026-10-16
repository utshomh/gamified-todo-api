import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import {
  ApiErrorResponseDto,
  ApiBadRequestErrorResponseDto,
  ValidationErrorDetailsDto,
} from './api-error-response.dto';
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
        $ref: getSchemaPath(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          code === 'BAD_REQUEST'
            ? ApiBadRequestErrorResponseDto
            : ApiErrorResponseDto,
        ),
      },
      {
        type: 'object',
        required: ['statusCode', 'code', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
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
            example: definition.message,
          },
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
        headers: {
          'X-Request-ID': {
            description: 'Request identifier shared with the server logs.',
            schema: { type: 'string', format: 'uuid' },
          },
        },
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
                      success: false,
                      statusCode: definition.status,
                      code,
                      message: definition.message,
                      timestamp: '2004-07-09T00:00:00.000Z',
                      path: '/api/v1/foo-bar',
                      ...(code === 'BAD_REQUEST'
                        ? {
                            details: {
                              errors: ['message must be equal to ping'],
                            },
                          }
                        : {}),
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
    ApiExtraModels(
      ApiErrorResponseDto,
      ApiBadRequestErrorResponseDto,
      ValidationErrorDetailsDto,
    ),
    ...responseDecorators,
  );
}

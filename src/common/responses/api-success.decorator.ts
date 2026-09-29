import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiSuccessResponse<TModel extends Type<unknown>>(
  model: TModel,
  description = 'Successful response',
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['timestamp', 'success', 'path', 'data'],
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-06T09:52:00.000Z',
          },
          success: {
            type: 'boolean',
            enum: [true],
            example: true,
          },
          path: {
            type: 'string',
            example: '/api/v1/app/status',
          },
          data: {
            $ref: getSchemaPath(model),
          },
        },
      },
    }),
  );
}

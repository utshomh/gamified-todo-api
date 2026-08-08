import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrors } from '../../common/errors/api-errors.decorator';

import { ApiSuccessResponse } from '../../common/responses/api-success.decorator';

import type { AccessTokenPayload } from '../auth/auth.types';

import { AuthTokenGuard } from '../auth/access-token.guard';

import { UserService } from './user.service';

import { MeResponseDto } from './dto/me.dto';
import { AuthPayload } from '../auth/auth-payload.decorator';

@ApiTags('User')
@ApiErrors('INTERNAL_ERROR')
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthTokenGuard)
  @ApiErrors('NOT_FOUND')
  @Get('/me')
  @ApiOperation({
    summary: 'Get Authenticated User',
    description: 'Returns the currently authenticated user',
  })
  @ApiSuccessResponse(MeResponseDto, 'Returns the currently authenticated user')
  me(@AuthPayload() payload: AccessTokenPayload): Promise<MeResponseDto> {
    return this.userService.me(payload.userId);
  }
}

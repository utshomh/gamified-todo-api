import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { ApiErrors } from '../common/errors/api-errors.decorator';

import { AppService } from './app.service';
import { StatusResponseDto } from './dto/status.dto';
import { PongResponseDto, PingRequestDto } from './dto/ping.dto';

@ApiErrors('INTERNAL_ERROR')
@Controller({ path: 'app', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/status')
  @ApiOperation({
    summary: 'Get server status',
    description:
      'Returns the current health and version information of the API.',
  })
  @ApiOkResponse({
    description: 'Return server status',
    type: StatusResponseDto,
  })
  getStatus(): StatusResponseDto {
    return this.appService.getStatus();
  }

  @ApiErrors('VALIDATION_ERROR')
  @Post('/ping')
  @ApiOperation({
    summary: 'Ping the server',
    description: 'Returns the string `pong`',
  })
  @ApiOkResponse({
    description: 'Return the string `pong`',
    type: PongResponseDto,
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pong(@Body() _dto: PingRequestDto): PongResponseDto {
    return this.appService.pong();
  }
}

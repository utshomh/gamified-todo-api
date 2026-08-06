import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiErrors } from '../common/errors/api-errors.decorator';

import { AppService } from './app.service';
import { StatusResponseDto } from './dto/status.dto';
import { HealthResponseDto } from './dto/health.dto';
import { PongResponseDto, PingRequestDto } from './dto/ping.dto';

@ApiTags('Server Health Status')
@ApiErrors('INTERNAL_ERROR')
@Controller({ path: 'app', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/status')
  @ApiOperation({
    summary: 'Get Server Status',
    description:
      'Returns the current health and version information of the API.',
  })
  @ApiOkResponse({
    description: 'Returns application status',
    type: StatusResponseDto,
  })
  getStatus(): StatusResponseDto {
    return this.appService.getStatus();
  }

  @ApiErrors('VALIDATION_ERROR')
  @Post('/ping')
  @ApiOperation({
    summary: 'Ping Server',
    description: 'Returns the string `pong`',
  })
  @ApiCreatedResponse({
    description: 'Returns the string `pong`',
    type: PongResponseDto,
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pong(@Body() _dto: PingRequestDto): PongResponseDto {
    return this.appService.pong();
  }

  @Get('/health')
  @ApiOperation({
    summary: 'Server Health',
    description: 'Checks and returns server health information',
  })
  @ApiOkResponse({
    description: 'Returns server health',
    type: HealthResponseDto,
  })
  health(): Promise<HealthResponseDto> {
    return this.appService.health();
  }
}

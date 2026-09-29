import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';

import { ApiErrors } from '../../common/errors/api-errors.decorator';
import { ApiSuccessResponse } from '../../common/responses/api-success.decorator';

import { AuthService } from './auth.service';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RotateTokenDto, RotateTokenResponseDto } from './dto/rotate-token.dto';

@ApiTags('Authentication')
@ApiErrors('INTERNAL_ERROR')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiErrors('BAD_REQUEST', 'CONFLICT')
  @Post('/register')
  @ApiOperation({
    summary: 'Register an Auth User',
    description: 'Returns the registered user',
  })
  @ApiSuccessResponse(RegisterResponseDto, 'Returns the registered user')
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @ApiErrors('BAD_REQUEST', 'UNAUTHORIZED')
  @Post('/login')
  @ApiOperation({
    summary: 'Logs in an User',
    description: 'Returns the Access and Refresh Token',
  })
  @ApiSuccessResponse(LoginResponseDto, 'Returns the Access and Refresh Token')
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @ApiErrors('BAD_REQUEST', 'UNAUTHORIZED')
  @Post('/rotate-token')
  @ApiOperation({
    summary: 'Rotate/Refresh Access Token',
    description: 'Rotates old Access Token with a new one',
  })
  @ApiSuccessResponse(
    RotateTokenResponseDto,
    'Returns the Access and Refresh Token',
  )
  rotateToken(@Body() dto: RotateTokenDto): Promise<RotateTokenResponseDto> {
    return this.authService.rotateToken(dto);
  }
}

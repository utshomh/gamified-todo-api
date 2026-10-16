import type { AuthController } from '../src/modules/auth/auth.controller';
import type { UserController } from '../src/modules/user/user.controller';
import type { AppController } from '../src/app/app.controller';
import type { RegisterDto } from '../src/modules/auth/dto/register.dto';
import type { LoginDto } from '../src/modules/auth/dto/login.dto';
import type { RotateTokenDto } from '../src/modules/auth/dto/rotate-token.dto';
import type { PingRequestDto } from '../src/app/dto/ping.dto';
import type { ApiErrorResponseDto } from '../src/common/errors/api-error-response.dto';
import type { components, paths } from './schema';

type Assert<T extends true> = T;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// Compilation fails when generated HTTP contracts drift from controller/DTO types.
export type ContractChecks = [
  Assert<Equal<RegisterDto, components['schemas']['RegisterDto']>>,
  Assert<Equal<LoginDto, components['schemas']['LoginDto']>>,
  Assert<Equal<RotateTokenDto, components['schemas']['RotateTokenDto']>>,
  Assert<Equal<PingRequestDto, components['schemas']['PingRequestDto']>>,
  Assert<
    Equal<ApiErrorResponseDto, components['schemas']['ApiErrorResponseDto']>
  >,
  Assert<
    Equal<
      Awaited<ReturnType<AuthController['register']>>,
      paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      Awaited<ReturnType<AuthController['login']>>,
      paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      Awaited<ReturnType<AuthController['rotateToken']>>,
      paths['/api/v1/auth/rotate-token']['post']['responses'][200]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      Awaited<ReturnType<UserController['me']>>,
      paths['/api/v1/user/me']['get']['responses'][200]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      ReturnType<AppController['getStatus']>,
      paths['/api/v1/app/status']['get']['responses'][200]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      ReturnType<AppController['pong']>,
      paths['/api/v1/app/ping']['post']['responses'][201]['content']['application/json']['data']
    >
  >,
  Assert<
    Equal<
      Awaited<ReturnType<AppController['health']>>,
      paths['/api/v1/app/health']['get']['responses'][200]['content']['application/json']['data']
    >
  >,
];

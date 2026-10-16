import { hash, verify } from 'argon2';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { UserService } from '../user/user.service';
import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthSessionService } from './auth-session.service';

import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { RotateTokenDto, RotateTokenResponseDto } from './dto/rotate-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userService.getUserByEmail(dto.email);
    if (existingUser)
      throw new AppError(
        'CONFLICT',
        'Email already in use. Choose a different email or login with this email.',
      );

    const passwordHash = await hash(dto.password);

    return this.userService.createUser(
      dto.displayName,
      dto.email,
      passwordHash,
      dto.timezone,
    );
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userService.getUserByEmail(dto.email);

    if (!user || !(await verify(user.passwordHash, dto.password))) {
      throw new AppError(
        'UNAUTHORIZED',
        'Provided credentials do not match our records.',
      );
    }

    const identity = { userId: user.id, sessionId: randomUUID() };

    const pair = await this.jwtTokenService.generateTokenPair(identity);

    const tokenHash = await hash(pair.refreshToken);

    const claims = await this.jwtTokenService.verifyRefreshToken(
      pair.refreshToken,
    );

    await this.authSessionService.createSession({
      ...identity,
      tokenHash,
      expiresAt: new Date(claims.exp * 1000),
    });

    return pair;
  }

  async rotateToken(dto: RotateTokenDto): Promise<RotateTokenResponseDto> {
    const identity = await this.verifyRefreshTokenOrThrow(dto.refreshToken);

    const previous =
      await this.authSessionService.requireActiveSession(identity);

    if (!(await verify(previous.tokenHash, dto.refreshToken))) {
      throw new AppError(
        'UNAUTHORIZED',
        'The refresh token does not match the session.',
      );
    }

    const nextIdentity = { userId: identity.userId, sessionId: randomUUID() };

    const pair = await this.jwtTokenService.generateTokenPair(nextIdentity);

    const tokenHash = await hash(pair.refreshToken);

    const claims = await this.jwtTokenService.verifyRefreshToken(
      pair.refreshToken,
    );

    await this.authSessionService.rotateSession(
      { ...identity, tokenHash: previous.tokenHash },
      { ...nextIdentity, tokenHash, expiresAt: new Date(claims.exp * 1000) },
    );

    return pair;
  }

  private async verifyRefreshTokenOrThrow(refreshToken: string) {
    try {
      return await this.jwtTokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        'UNAUTHORIZED',
        'The refresh token is invalid or expired.',
      );
    }
  }
}

import { hash, verify } from 'argon2';
import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';

import { AppError } from '../../common/errors/app-error';

import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';

import { UserService } from '../user/user.service';
import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthSessionService } from './auth-session.service';
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
    if (existingUser) {
      throw new AppError(
        'CONFLICT',
        'Email already in use. Choose a different email or login with this email.',
      );
    }

    const passwordHash = await hash(dto.password);
    const user = await this.userService.createUser(
      dto.displayName,
      dto.email,
      passwordHash,
      dto.timezone,
    );

    return user;
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const existingUser = await this.userService.getUserByEmail(dto.email);

    if (!existingUser) {
      throw new AppError(
        'UNAUTHORIZED',
        'Provided credentials do not match our records.',
      );
    }

    const passwordMatches = await verify(
      existingUser.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new AppError(
        'UNAUTHORIZED',
        'Provided credentials do not match our records.',
      );
    }

    const sessionId = createId();

    const refreshToken = await this.jwtTokenService.generateRefreshToken({
      userId: existingUser.id,
      sessionId,
    });

    const refreshTokenHash = await hash(refreshToken);

    const session = await this.authSessionService.createSession({
      sessionId,
      userId: existingUser.id,
      tokenHash: refreshTokenHash,
    });

    const accessToken = await this.jwtTokenService.generateAccessToken({
      userId: existingUser.id,
      sessionId: session.id,
    });

    return { accessToken, refreshToken };
  }

  async rotateToken(dto: RotateTokenDto): Promise<RotateTokenResponseDto> {
    const { sessionId: existingSessionId, userId } =
      await this.verifyRefreshTokenOrThrow(dto.refreshToken);

    if (existingSessionId)
      await this.authSessionService.revokeSession(existingSessionId);

    const sessionId = createId();

    const refreshToken = await this.jwtTokenService.generateRefreshToken({
      userId,
      sessionId,
    });

    const refreshTokenHash = await hash(refreshToken);

    const session = await this.authSessionService.createSession({
      sessionId,
      userId,
      tokenHash: refreshTokenHash,
    });

    const accessToken = await this.jwtTokenService.generateAccessToken({
      userId,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshTokenOrThrow(refreshToken: string) {
    try {
      return this.jwtTokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        'UNAUTHORIZED',
        'Invalid or Expired token. Please provide a valid refresh token in order to access this route.',
      );
    }
  }
}

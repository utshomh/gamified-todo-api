import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../../config/app-config.service';
import {
  accessTokenSchema,
  refreshTokenSchema,
  tokenIdentitySchema,
  type TokenIdentity,
} from '../auth.types';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
  ) {}

  generateAccessToken(payload: TokenIdentity) {
    return this.jwtService.signAsync(
      { ...tokenIdentitySchema.parse(payload), tokenType: 'access' },
      {
        secret: this.appConfig.jwtAccessSecret,
        algorithm: 'HS256',
        expiresIn: this.appConfig.jwtAccessTtl,
      },
    );
  }
  generateRefreshToken(payload: TokenIdentity) {
    return this.jwtService.signAsync(
      { ...tokenIdentitySchema.parse(payload), tokenType: 'refresh' },
      {
        secret: this.appConfig.jwtRefreshSecret,
        algorithm: 'HS256',
        expiresIn: this.appConfig.jwtRefreshTtl,
      },
    );
  }
  async generateTokenPair(payload: TokenIdentity) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);
    return { accessToken, refreshToken };
  }
  async verifyAccessToken(token: string) {
    const payload: unknown = await this.jwtService.verifyAsync(token, {
      secret: this.appConfig.jwtAccessSecret,
      algorithms: ['HS256'],
    });
    return accessTokenSchema.parse(payload);
  }
  async verifyRefreshToken(token: string) {
    const payload: unknown = await this.jwtService.verifyAsync(token, {
      secret: this.appConfig.jwtRefreshSecret,
      algorithms: ['HS256'],
    });
    return refreshTokenSchema.parse(payload);
  }
}

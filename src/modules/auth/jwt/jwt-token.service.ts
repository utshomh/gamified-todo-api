import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AppConfigService } from '../../../config/app-config.service';

import { AccessTokenPayload, RefreshTokenPayload } from '../auth.types';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
  ) {}

  async generateAccessToken(payload: AccessTokenPayload) {
    return this.jwtService.signAsync<AccessTokenPayload>(payload, {
      expiresIn: this.appConfig.jwtAccessTtl,
    });
  }

  async generateRefreshToken(payload: RefreshTokenPayload) {
    return this.jwtService.signAsync<RefreshTokenPayload>(payload, {
      expiresIn: this.appConfig.jwtRefreshTtl,
    });
  }

  async generateTokenPair(payload: AccessTokenPayload) {
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }

  async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token);
  }
}

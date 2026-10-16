import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppConfigService } from '../../../config/app-config.service';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  const config = {
    jwtAccessSecret: 'access'.repeat(8),
    jwtRefreshSecret: 'refresh'.repeat(8),
    jwtAccessTtl: 900,
    jwtRefreshTtl: 604800,
  };
  const identity = { userId: 'user', sessionId: 'session' };
  const jwt = new JwtService();
  let tokens: JwtTokenService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        { provide: JwtService, useValue: jwt },
        { provide: AppConfigService, useValue: config },
      ],
    }).compile();
    tokens = module.get(JwtTokenService);
  });
  it('uses distinct secrets and rejects cross-use', async () => {
    const pair = await tokens.generateTokenPair(identity);
    await expect(
      tokens.verifyAccessToken(pair.accessToken),
    ).resolves.toMatchObject({ ...identity, tokenType: 'access' });
    await expect(
      tokens.verifyRefreshToken(pair.refreshToken),
    ).resolves.toMatchObject({ ...identity, tokenType: 'refresh' });
    await expect(tokens.verifyAccessToken(pair.refreshToken)).rejects.toThrow();
    await expect(tokens.verifyRefreshToken(pair.accessToken)).rejects.toThrow();
  });
  it('uses seconds for JWT expiry', async () => {
    const pair = await tokens.generateTokenPair(identity);
    const access = await tokens.verifyAccessToken(pair.accessToken);
    const refresh = await tokens.verifyRefreshToken(pair.refreshToken);
    expect(access.exp - access.iat).toBe(900);
    expect(refresh.exp - refresh.iat).toBe(604800);
  });
  it.each([
    { sessionId: 'session', tokenType: 'access' },
    { ...identity, tokenType: 'refresh' },
    { ...identity, tokenType: 'access', userId: '' },
    { ...identity, tokenType: 'access', sessionId: 42 },
  ])('rejects invalid signed access claims: %j', async (payload) => {
    const token = await jwt.signAsync(payload, {
      secret: config.jwtAccessSecret,
      expiresIn: 900,
    });
    await expect(tokens.verifyAccessToken(token)).rejects.toThrow();
  });
  it('requires expiry, even on a correctly signed token', async () => {
    const token = await jwt.signAsync(
      { ...identity, tokenType: 'access' },
      { secret: config.jwtAccessSecret },
    );
    await expect(tokens.verifyAccessToken(token)).rejects.toThrow();
  });
  it('rejects expired tokens', async () => {
    const token = await jwt.signAsync(
      { ...identity, tokenType: 'refresh' },
      { secret: config.jwtRefreshSecret, expiresIn: -1 },
    );
    await expect(tokens.verifyRefreshToken(token)).rejects.toThrow();
  });
});

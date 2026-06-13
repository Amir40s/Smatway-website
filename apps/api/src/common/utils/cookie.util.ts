import { type CookieOptions, type Response } from 'express';

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN ?? process.env.AUTH_COOKIE_DOMAIN;

function getCookieOptions(maxAge: number) {
  const options: CookieOptions = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };

  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  return options;
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(
    'access_token',
    accessToken,
    getCookieOptions(30 * 24 * 60 * 60 * 1000),
  );
  res.cookie(
    'refresh_token',
    refreshToken,
    getCookieOptions(30 * 24 * 60 * 60 * 1000),
  );
}

export function clearAuthCookies(res: Response): void {
  const base: CookieOptions = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
  };

  if (COOKIE_DOMAIN) {
    base.domain = COOKIE_DOMAIN;
  }

  res.clearCookie('access_token', base);
  res.clearCookie('refresh_token', base);
}

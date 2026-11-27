import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '../prisma';
import { env } from '../config/env';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth/github',
};

export async function redirectToGithub(_req: Request, res: Response) {
  const state = randomBytes(32).toString('hex');

  res.cookie('github_oauth_state', state, {
    ...stateCookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: 'read:user',
    state,
  });

  return res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}

export async function githubCallback(req: Request, res: Response) {
  const code = req.query.code;
  const receivedState = req.query.state;
  const savedState = req.cookies?.github_oauth_state;

  res.clearCookie('github_oauth_state', stateCookieOptions);

  if (
    typeof code !== 'string' ||
    typeof receivedState !== 'string' ||
    typeof savedState !== 'string' ||
    receivedState.length !== savedState.length ||
    !timingSafeEqual(Buffer.from(receivedState), Buffer.from(savedState))
  ) {
    return res.status(400).json({
      error: 'Autenticação inválida. Tente novamente.',
    });
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
      code,
      redirect_uri: env.github.callbackUrl,
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return res.status(401).json({
      error: 'Falha ao obter access_token do GitHub.',
    });
  }

  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'sinutre-back',
    },
  });

  if (!userResponse.ok) {
    return res.status(401).json({
      error: 'Não foi possível obter os dados da conta GitHub.',
    });
  }

  const githubUser = (await userResponse.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string | null;
  };

  const user = await prisma.user.upsert({
    where: { githubId: String(githubUser.id) },
    update: {
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
    create: {
      githubId: String(githubUser.id),
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
  });

  const token = jwt.sign(
    { sub: user.id },
    env.jwtSecret,
    { expiresIn: '7d' },
  );

  res.cookie('sinutre_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect(env.frontendUrl);
}

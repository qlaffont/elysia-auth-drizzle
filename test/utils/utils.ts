/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'bun:test';
import { eq } from 'drizzle-orm';
import Elysia from 'elysia';
import { sign } from 'jsonwebtoken';

import { HTTPMethods } from '../../src/type';
import { db } from './db';
import { tokens } from './schema';
import { userData } from './server.test';

export const generateToken = async () => {
  const jwtAccessToken = await sign({ id: userData.id }, 'test', {
    expiresIn: '1d',
  });

  const jwtRefreshToken = await sign({ id: userData.id }, 'test', {
    expiresIn: '1d',
  });

  return await db
    .insert(tokens)
    .values({
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      ownerId: userData.id,
    })
    .returning()
    .then((res) => res[0]);
};

export const cleanToken = async (token: typeof tokens.$inferSelect) => {
  await db.delete(tokens).where(eq(tokens.id, token.id));
};

export const testRoute = async (
  server: Elysia,
  routePath: string,
  method: HTTPMethods,
  data: {
    headers?: Record<string, any>;
    cookies?: Record<string, any>;
  },
  validation: {
    supposedStatus: number;
    supposedMessage?: string | Record<string, any>;
  },
): Promise<unknown> => {
  let status: number;
  let content: Record<string, unknown> | string | undefined | null;
  let json = false;

  await server
    .handle(
      new Request(`http://localhost${routePath}`, {
        headers: data?.headers || {},
        method: method,
      }),
    )
    .then(async (res) => {
      status = res.status;

      try {
        content = await res.json();
        json = true;
        return;
        // eslint-disable-next-line no-empty
      } catch (error) {}

      try {
        content = await res.text();
        return;
        // eslint-disable-next-line no-empty
      } catch (error) {}

      return;
    });

  if (validation.supposedStatus) {
    expect(status!).toBe(validation.supposedStatus);
  }

  if (validation.supposedMessage) {
    if (json) {
      //@ts-ignore
      expect(content).toMatchObject(validation.supposedMessage);
    } else {
      //@ts-ignore
      expect(content).toEqual(validation.supposedMessage);
    }
  }

  return;
};

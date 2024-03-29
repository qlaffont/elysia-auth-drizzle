import { describe, it } from 'bun:test';
import { eq } from 'drizzle-orm';

import { db } from './utils/db';
import { tokens } from './utils/schema';
import { app, expiredTokenValue, userData } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server;

describe('Public/Private page', () => {
  describe('Public', () => {
    it('should be able to access page without token', async () => {
      server = await app({
        config: [{ url: '/public-success', method: 'GET' }],
      });

      await testRoute(
        server,
        `/public-success`,
        'GET',
        {},
        { supposedStatus: 200 },
      );
    });

    it('should be able to access page with token', async () => {
      server = await app({
        config: [{ url: '/public-success', method: 'GET' }],
      });

      const token = await generateToken();

      await testRoute(
        server,
        `/public-success`,
        'GET',
        {
          headers: { authorization: `Bearer ${token.accessToken}` },
        },
        { supposedStatus: 200 },
      );

      await cleanToken(token);
    });

    it('should be able to access page with invalid token', async () => {
      server = await app({
        config: [{ url: '/public-success', method: 'GET' }],
      });

      await testRoute(
        server,
        `/public-success`,
        'GET',
        {
          headers: { authorization: `Bearer thisisawrongtoken` },
        },
        { supposedStatus: 200 },
      );
    });

    it('should be able to access page with expired token', async () => {
      server = await app({
        config: [{ url: '/public-success', method: 'GET' }],
      });

      const token = await db
        .insert(tokens)
        .values({
          accessToken: expiredTokenValue,
          refreshToken: 'test',
          ownerId: userData.id,
        })
        .returning();

      await testRoute(
        server,
        `/public-success`,
        'GET',
        {
          headers: { authorization: `Bearer ${expiredTokenValue}` },
        },
        { supposedStatus: 200 },
      );

      await db.delete(tokens).where(eq(tokens.id, token[0].id));
    });
  });

  describe('Private', () => {
    it('should return unauthorized if no token', async () => {
      server = await app();

      await testRoute(
        server,
        `/not-public-success`,
        'GET',
        {},
        {
          supposedStatus: 401,
          supposedMessage: {
            error: 'Unauthorized',
            context: { error: 'Page is not public' },
          },
        },
      );
    });

    it('should return page if token is valid', async () => {
      server = await app();

      const token = await generateToken();

      await testRoute(
        server,
        `/not-public-success`,
        'GET',
        {
          headers: {
            authorization: `Bearer ${token.accessToken}`,
          },
        },
        {
          supposedStatus: 200,
        },
      );

      await cleanToken(token);
    });

    it('should return unauthorized token is invalid', async () => {
      server = await app();

      await testRoute(
        server,
        `/not-public-success`,
        'GET',
        {
          headers: {
            authorization: `Bearer thisIsAWrongToken`,
          },
        },
        {
          supposedStatus: 401,
          supposedMessage: {
            error: 'Unauthorized',
            context: { error: 'Token is not valid' },
          },
        },
      );
    });

    it('should return unauthorized token is expired', async () => {
      server = await app();

      const token = await db
        .insert(tokens)
        .values({
          accessToken: expiredTokenValue,
          refreshToken: 'test',
          ownerId: userData.id,
        })
        .returning();

      await testRoute(
        server,
        `/not-public-success`,
        'GET',
        {
          headers: {
            authorization: `Bearer ${expiredTokenValue}`,
          },
        },
        {
          supposedStatus: 401,
          supposedMessage: {
            error: 'Unauthorized',
            context: { error: 'Token is not valid' },
          },
        },
      );

      await db.delete(tokens).where(eq(tokens.id, token[0].id));
    });
  });
});

import { describe, it } from 'bun:test';

import { signCookie } from '../src/elysia-auth-plugin';
import { app } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server;

describe('Access Token value', () => {
  it('should be able to access token from authorization header', async () => {
    server = await app();

    const token = await generateToken();

    await testRoute(
      server,
      '/not-public-success',
      'GET',
      {
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      },
      { supposedStatus: 200 },
    );

    await cleanToken(token);
  });

  it('should be able to access token from Authorization header', async () => {
    server = await app();

    const token = await generateToken();

    await testRoute(
      server,
      '/not-public-success',
      'GET',
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
      { supposedStatus: 200 },
    );

    await cleanToken(token);
  });

  it('should be able to access token from access_token query param', async () => {
    server = await app();

    const token = await generateToken();

    await testRoute(
      server,
      `/not-public-success?access_token=${encodeURIComponent(
        token.accessToken,
      )}`,
      'GET',
      {
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      },
      { supposedStatus: 200 },
    );

    await cleanToken(token);
  });

  it('should be able to access token from Authorization cookie', async () => {
    server = await app();

    const token = await generateToken();

    await testRoute(
      server,
      `/not-public-success`,
      'GET',
      {
        headers: {
          Cookie: `authorization=${token.accessToken}`,
        },
      },
      { supposedStatus: 200 },
    );

    await cleanToken(token);
  });

  it('should be able to access token from Authorization cookie (SIGNED)', async () => {
    server = await app({
      cookieSecret: 'test',
    });

    const token = await generateToken();

    await testRoute(
      server,
      `/not-public-success`,
      'GET',
      {
        headers: {
          Cookie: `authorization=${await signCookie(token.accessToken, 'test')}`,
        },
      },
      { supposedStatus: 200 },
    );

    await cleanToken(token);
  });
});

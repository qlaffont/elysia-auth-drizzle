import { describe, it } from 'bun:test';
import Elysia from 'elysia';

import { app } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server: Elysia;

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

  //TODO Wait answer
  // it('should be able to access token from Authorization cookie', async () => {
  //   server = await app();

  //   const token = await generateToken();

  //   const response = await server.inject({
  //     method: 'GET',
  //     url: '/not-public-success',
  //     cookies: {
  //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //       //@ts-ignore
  //       authorization: server.signCookie(token.accessToken),
  //     },
  //   });

  //   expect(response.statusCode).toBe(200);

  //   await cleanToken(token);
  // });
});

import { describe, it } from 'bun:test';

import { app } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server;

describe('Default', () => {
  it('should return Unauthorized, if url is not in config and no token', async () => {
    server = await app();

    await testRoute(
      server,
      `/public-success`,
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

  it('should return page, if url is not in config and token', async () => {
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
});

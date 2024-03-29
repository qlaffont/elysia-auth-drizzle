import { describe, expect, it } from 'bun:test';

import { app, userData } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server;

describe('User validation', () => {
  it('should execute user validation', async () => {
    let connectedUserId: string = 'wrongid';

    server = await app({
      userValidation: async (user) => {
        connectedUserId = user.id;
      },
    });

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

    expect(connectedUserId).toBe(userData.id);

    await cleanToken(token);
  });
});

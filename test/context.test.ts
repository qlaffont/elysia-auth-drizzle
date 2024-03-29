import { describe, it } from 'bun:test';

import { app, userData } from './utils/server.test';
import { cleanToken, generateToken, testRoute } from './utils/utils';

let server;

describe('Context', () => {
  describe('connectedUser', () => {
    it('should be able to get user if connected', async () => {
      server = await app();

      const token = await generateToken();

      await testRoute(
        server,
        `/get-req-user`,
        'GET',
        {
          headers: {
            authorization: `Bearer ${token.accessToken}`,
          },
        },
        { supposedStatus: 200, supposedMessage: { id: userData.id } },
      );

      await cleanToken(token);
    });

    it('should be able to get nothing if not connected', async () => {
      server = await app({ config: [{ url: '/get-req-user', method: 'GET' }] });

      await testRoute(
        server,
        `/get-req-user`,
        'GET',
        {},
        { supposedStatus: 200, supposedMessage: undefined },
      );
    });
  });

  describe('isConnected', () => {
    it('should be able to return true if connected', async () => {
      server = await app();

      const token = await generateToken();

      await testRoute(
        server,
        `/get-req-isConnected`,
        'GET',
        {
          headers: {
            authorization: `Bearer ${token.accessToken}`,
          },
        },
        { supposedStatus: 200, supposedMessage: { isConnected: true } },
      );

      await cleanToken(token);
    });

    it('should be able to return false if not connected', async () => {
      server = await app({
        config: [{ url: '/get-req-isConnected', method: 'GET' }],
      });

      await testRoute(
        server,
        `/get-req-isConnected`,
        'GET',
        {},
        { supposedStatus: 200, supposedMessage: { isConnected: false } },
      );
    });
  });
});

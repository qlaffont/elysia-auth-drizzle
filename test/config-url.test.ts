import { describe, it } from 'bun:test';

import { app, methods } from './utils/server.test';
import { testRoute } from './utils/utils';

let server;

describe('Config Url', () => {
  it('should validate on url and method specified', async () => {
    server = await app({ config: [{ url: '/public-success', method: 'GET' }] });

    await testRoute(
      server,
      '/public-success',
      'GET',
      {},
      { supposedStatus: 200 },
    );
  });

  it('should validate on url and method not specified', async () => {
    server = await app({ config: [{ url: '/public-success', method: '*' }] });

    await testRoute(
      server,
      '/public-success',
      'GET',
      {},
      { supposedStatus: 200 },
    );
  });

  it('should validate on url and for each method', async () => {
    for (const method of methods) {
      server = await app({
        config: [{ url: `/public-${method.toLowerCase()}`, method: method }],
      });

      await testRoute(
        server,
        `/public-${method.toLowerCase()}`,
        method,
        {},
        { supposedStatus: 200 },
      );
    }
  });

  it('should validate on url who contain parameter', async () => {
    server = await app({
      config: [
        {
          url: `/public-success/:variable1/tuto/:variable3/get`,
          method: 'GET',
        },
      ],
    });

    await testRoute(
      server,
      `/public-success/testvariable/tuto/test/get`,
      'GET',
      {},
      { supposedStatus: 200 },
    );
  });
});

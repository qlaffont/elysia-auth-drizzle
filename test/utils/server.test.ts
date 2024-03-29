import { logger } from '@bogeychan/elysia-logger';
import { Elysia } from 'elysia';
import { pluginUnifyElysia } from 'unify-elysia';

import {
  elysiaAuthDrizzlePlugin,
  ElysiaAuthDrizzlePluginConfig,
} from '../../src';
import { HTTPMethods } from '../../src/type';
import { db } from './db';
import { tokens, users } from './schema';

export const userData = {
  id: '04319e04-08d4-452f-9a46-9c1f9e79e2f0',
};

export const methods = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
  'OPTIONS',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
  'TRACE',
  'SEARCH',
] as HTTPMethods[];

export const expiredTokenValue =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA0MzE5ZTA0LTA4ZDQtNDUyZi05YTQ2LTljMWY5ZTc5ZTJmMCIsImlhdCI6MTY2MDgyNDg2NSwiZXhwIjoxNjYwODI0ODY2fQ.aZOpXfb-1l-TlYzlaMBo-00J99I_NTP4ELuXpSgS6Lg';

export const defaultSuccess = () => {
  return { success: true };
};

export const app = <T>(config?: Partial<ElysiaAuthDrizzlePluginConfig<T>>) => {
  const server = new Elysia()
    .use(
      logger({
        level: 'error',
      }),
    )
    //TODO : ISSUE WITH TS
    .use(pluginUnifyElysia({}))
    .use(
      elysiaAuthDrizzlePlugin<typeof users.$inferSelect>({
        config: [
          {
            url: '/public',
            method: 'GET',
          },
        ],
        secret: 'test',
        drizzle: {
          db: db,
          usersSchema: users,
          tokensSchema: tokens,
        },
        userValidation: (user) => {
          user;
        },
        ...config,
      }),
    )
    .get('/public-success', defaultSuccess)
    .get('/public-success/:variable1/:variable2/:variable3/get', defaultSuccess)
    .get('/not-public-success', defaultSuccess)
    .get('/get-req-user', ({ connectedUser }) => {
      return connectedUser;
    })
    .get('/get-req-isConnected', ({ isConnected }) => {
      return { isConnected };
    });

  for (const method of methods) {
    server.route(method, `/public-${method.toLowerCase()}`, defaultSuccess);
  }

  return server;
};

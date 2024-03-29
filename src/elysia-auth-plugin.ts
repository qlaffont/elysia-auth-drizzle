/* eslint-disable @typescript-eslint/ban-ts-comment */
import { eq } from 'drizzle-orm';
import Elysia from 'elysia';
import { verify } from 'jsonwebtoken';
import { Unauthorized } from 'unify-errors';

import { currentUrlAndMethodIsAllowed } from './currentUrlAndMethodIsAllowed';
import { HTTPMethods, UrlConfig } from './type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Options<T> {
  secret: string;
  drizzle: {
    //@ts-ignore
    db;
    //@ts-ignore
    tokensSchema;
    //@ts-ignore
    usersSchema;
  };
  config?: UrlConfig[];
  cookieIsSigned?: boolean;
  //TODO TO FIX WITH <T> TYPE
  //@ts-ignore
  userValidation?: (user) => void | Promise<void>;
  verifyAccessTokenOnlyInJWT?: boolean;
}

export const getAccessTokenFromRequest = (req: {
  cookies?: Record<string, { value: string }>;
  query?: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
}) => {
  let token: string | undefined;

  //TODO: TO verify, because cookies seems to be unsigned before executing
  if (req.cookies && req.cookies['authorization']) {
    token = req.cookies['authorization'].value;
  }

  if ((req.query as { access_token: string }).access_token) {
    token = (req.query as { access_token: string }).access_token;
  }

  if (req.headers.authorization) {
    token = (req.headers.authorization as string).trim().split(' ')[1];
  }

  return token;
};

const checkTokenValidity =
  <T>(
    options: Options<T>,
    currentUrl: string,
    currentMethod: HTTPMethods,
    cookieManager: { [x: string]: { remove: () => void } },
  ) =>
  async (
    tokenValue?: string,
  ): Promise<{ connectedUser: T; isConnected: true } | void> => {
    //Check if token existing
    if (tokenValue) {
      let token;
      let tokenIsValidInDB = true;

      if (!options.verifyAccessTokenOnlyInJWT) {
        const result = await options.drizzle.db
          .select()
          .from(options.drizzle.tokensSchema)
          .where(eq(options.drizzle.tokensSchema.accessToken, tokenValue))
          .limit(1);

        if (result.length !== 1) {
          tokenIsValidInDB = false;
        } else {
          token = result[0];
        }
      }

      try {
        verify(tokenValue, options.secret);

        if (!tokenIsValidInDB) {
          throw 'Token not valid in DB';
        }
      } catch (error) {
        //If token is not valid and If user is not connected and url is not public
        if (
          !currentUrlAndMethodIsAllowed(
            currentUrl,
            currentMethod as HTTPMethods,
            options.config!,
          )
        ) {
          if (cookieManager && cookieManager['authorization']) {
            cookieManager['authorization'].remove();
          }

          throw new Unauthorized({
            error: 'Token is not valid',
          });
        }

        return;
      }

      const result = await options.drizzle.db
        .select()
        .from(options.drizzle.usersSchema)
        .where(eq(options.drizzle.usersSchema.id, token!.ownerId))
        .limit(1);

      const user = result[0];

      options.userValidation && (await options.userValidation(user));

      return {
        connectedUser: user as T,
        isConnected: true,
      };
    }
  };

export const elysiaAuthDrizzlePlugin = <T>(userOptions?: Options<T>) => {
  const defaultOptions: Omit<Required<Options<T>>, 'secret' | 'drizzle'> = {
    config: [],
    cookieIsSigned: false,
    userValidation: () => {},
    verifyAccessTokenOnlyInJWT: false,
  };

  const options = {
    ...defaultOptions,
    ...userOptions,
  } as Required<Options<T>>;

  return new Elysia({ name: 'elysia-auth-drizzle', seed: userOptions }).derive(
    { as: 'global' },
    async ({ headers, query, cookie, request }) => {
      let isConnected = false;
      let connectedUser: T | undefined;

      const req = {
        headers,
        query,
        cookies: cookie,
        url: new URL(request.url).pathname,
        method: request.method as HTTPMethods,
      };

      const tokenValue: string | undefined = getAccessTokenFromRequest(req);

      const res = await checkTokenValidity<T>(
        options as Options<T>,
        req.url,
        req.method,
        req.cookies,
      )(tokenValue);

      if (res) {
        connectedUser = res.connectedUser;
        isConnected = res.isConnected;
      }

      // If user is not connected and url is not public
      if (
        !isConnected &&
        !currentUrlAndMethodIsAllowed(
          req.url,
          req.method as HTTPMethods,
          options.config!,
        )
      ) {
        throw new Unauthorized({
          error: 'Page is not public',
        });
      }

      return {
        isConnected,
        connectedUser,
      };
    },
  );
};

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { verify } from 'jsonwebtoken';
import { Unauthorized } from 'unify-errors';

import { currentUrlAndMethodIsAllowed } from './currentUrlAndMethodIsAllowed';
import { HTTPMethods, UrlConfig } from './type';

//REF: https://github.com/elysiajs/elysia/blob/main/src/utils.ts
const encoder = new TextEncoder();
function removeTrailingEquals(digest: string): string {
  let trimmedDigest = digest;
  while (trimmedDigest.endsWith('=')) {
    trimmedDigest = trimmedDigest.slice(0, -1);
  }
  return trimmedDigest;
}

export const signCookie = async (val: string, secret: string | null) => {
  if (typeof val !== 'string')
    throw new TypeError('Cookie value must be provided as a string.');

  if (secret === null) throw new TypeError('Secret key must be provided.');

  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const hmacBuffer = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(val),
  );

  return (
    val + '.' + removeTrailingEquals(Buffer.from(hmacBuffer).toString('base64'))
  );
};
export const unsignCookie = async (input: string, secret: string | null) => {
  if (typeof input !== 'string')
    throw new TypeError('Signed cookie string must be provided.');

  if (null === secret) throw new TypeError('Secret key must be provided.');

  const tentativeValue = input.slice(0, input.lastIndexOf('.'));
  const expectedInput = await signCookie(tentativeValue, secret);

  return expectedInput === input ? tentativeValue : false;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Options<T> {
  jwtSecret: string;
  cookieSecret?: string;
  drizzle: {
    //@ts-ignore
    db;
    //@ts-ignore
    tokensSchema?;
    //@ts-ignore
    usersSchema;
  };
  config?: UrlConfig[];
  userValidation?: (user: T) => void | Promise<void>;
  verifyAccessTokenOnlyInJWT?: boolean;
  prefix?: string;
}

export const getAccessTokenFromRequest = async (
  req: {
    cookie?: Record<string, { value: string }>;
    query?: Record<string, string | undefined>;
    headers: Record<string, string | undefined>;
  },
  cookieSecret?: string,
) => {
  let token: string | undefined;

  if (
    req.cookie &&
    req.cookie['authorization'] &&
    req.cookie['authorization'].value
  ) {
    if (cookieSecret) {
      const result = await unsignCookie(
        req.cookie['authorization'].value,
        cookieSecret,
      );

      if (result === false) {
        throw new Unauthorized({
          error: 'Token is not valid',
        });
      } else {
        token = result;
      }
    } else {
      token = req.cookie['authorization'].value;
    }
  }

  if ((req.query as { access_token: string }).access_token) {
    token = (req.query as { access_token: string }).access_token;
  }

  if (req.headers.authorization) {
    token = (req.headers.authorization as string).trim().split(' ')[1];
  }

  return token;
};

export const checkTokenValidity =
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
      let userId;

      try {
        const tokenData = verify(tokenValue, options.jwtSecret);

        if (!options.verifyAccessTokenOnlyInJWT) {
          const result = await options.drizzle.db
            .select()
            .from(options.drizzle.tokensSchema)
            .where(eq(options.drizzle.tokensSchema.accessToken, tokenValue))
            .limit(1);

          if (result.length !== 1) {
            throw 'Token not valid in DB';
          } else {
            userId = result[0].ownerId;
          }
        } else {
          //@ts-ignore
          userId = tokenData.id;
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
        .where(eq(options.drizzle.usersSchema.id, userId))
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
  const defaultOptions: Omit<
    Required<Options<T>>,
    'jwtSecret' | 'cookieSecret' | 'drizzle' | 'prefix'
  > = {
    config: [],
    userValidation: () => {},
    verifyAccessTokenOnlyInJWT: false,
  };

  const options = {
    ...defaultOptions,
    ...userOptions,
  } as Required<Options<T>>;

  return new Elysia({ name: 'elysia-auth-drizzle' }).derive(
    { as: 'global' },
    async ({ headers, query, cookie, request }) => {
      let isConnected = false;
      let connectedUser: T | undefined;

      const req = {
        headers,
        query,
        cookie,
        url: new URL(request.url).pathname,
        method: request.method as HTTPMethods,
      };

      const tokenValue: string | undefined = await getAccessTokenFromRequest(
        req,
        options?.cookieSecret,
      );

      const res = await checkTokenValidity<T>(
        options as Options<T>,
        req.url,
        req.method,
        req.cookie,
      )(tokenValue);

      if (res) {
        connectedUser = res.connectedUser;
        isConnected = res.isConnected;
      }

      // If user is not connected and url is not public
      if (
        !isConnected &&
        (options.prefix ? !req.url.startsWith(options.prefix) : true) &&
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

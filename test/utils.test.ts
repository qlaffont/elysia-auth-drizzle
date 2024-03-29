import { describe, expect, it } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { BadRequest, NotFound } from 'unify-errors';

import {
  createUserToken,
  refreshUserToken,
  removeAllUserTokens,
  removeUserToken,
} from '../src';
import { db } from './utils/db';
import { tokens, users } from './utils/schema';
import { expiredTokenValue, userData } from './utils/server.test';

const secret = 'test';
const refreshSecret = 'testrefresh';

describe('Utils function', () => {
  describe('createUserToken', () => {
    it('should be able to create token for existing user', async () => {
      const result = await createUserToken({
        db,
        usersSchema: users,
        tokensSchema: tokens,
      })(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      const token = await db.query.tokens.findFirst({
        where: and(
          eq(tokens.accessToken, result.accessToken),
          eq(tokens.refreshToken, result.refreshToken),
        ),
      });

      expect(token).toMatchObject({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      await db.delete(tokens).where(eq(tokens.id, token!.id));
    });

    it('should return NotFound if user is not found', async () => {
      try {
        await createUserToken({
          db,
          usersSchema: users,
          tokensSchema: tokens,
        })('wrongid', {
          secret,
          accessTokenTime: '1d',
          refreshTokenTime: '7d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new NotFound({ error: 'User not found' }));
      }
    });
  });

  describe('removeUserToken', () => {
    it('should remove token ', async () => {
      const result = await createUserToken({
        db,
        usersSchema: users,
        tokensSchema: tokens,
      })(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      await removeUserToken({
        db,
        tokensSchema: tokens,
      })(result.accessToken);

      const token = await db.query.tokens.findFirst({
        where: and(
          eq(tokens.accessToken, result.accessToken),
          eq(tokens.refreshToken, result.refreshToken),
        ),
      });

      expect(token as undefined).toBe(undefined);
    });
  });

  describe('removeAllUserTokens', () => {
    it('should remove token ', async () => {
      const result = await createUserToken({
        db,
        usersSchema: users,
        tokensSchema: tokens,
      })(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      await removeAllUserTokens({
        db,
        tokensSchema: tokens,
      })(userData.id);

      const token = await db.query.tokens.findFirst({
        where: and(
          eq(tokens.accessToken, result.accessToken),
          eq(tokens.refreshToken, result.refreshToken),
        ),
      });

      expect(token as undefined).toBe(undefined);
    });
  });

  describe('refreshUserToken', () => {
    it('should be able to refresh user token ', async () => {
      const result = await createUserToken({
        db,
        usersSchema: users,
        tokensSchema: tokens,
      })(userData.id, {
        secret,
        refreshSecret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      const resultRefresh = await refreshUserToken({
        db,
        tokensSchema: tokens,
      })(result.refreshToken, {
        secret,
        refreshSecret,
        accessTokenTime: '2d',
      });

      expect(resultRefresh?.accessToken).not.toBe(result.accessToken);
    });

    it('should return a Bad request is token is expired ', async () => {
      try {
        await refreshUserToken({
          db,
          tokensSchema: tokens,
        })(expiredTokenValue, {
          secret,
          accessTokenTime: '1d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new BadRequest({ error: 'Token expired' }));
      }
    });

    it("should return a Not Found if token doesn't exist", async () => {
      try {
        await refreshUserToken({
          db,
          tokensSchema: tokens,
        })(sign({ userId: 'test' }, secret), {
          secret,
          accessTokenTime: '1d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new NotFound({ error: 'Token not found' }));
      }
    });
  });
});

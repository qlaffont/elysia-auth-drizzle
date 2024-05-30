/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from 'drizzle-orm';
import { sign, verify } from 'jsonwebtoken';
import { BadRequest, NotFound } from 'unify-errors';

export const createUserToken =
  //@ts-ignore


    ({ db, usersSchema, tokensSchema }) =>
    async (
      userId: string,
      {
        secret,
        refreshSecret,
        accessTokenTime,
        refreshTokenTime,
      }: {
        secret: string;
        refreshSecret?: string;
        accessTokenTime: string;
        refreshTokenTime: string;
      },
    ) => {
      let user;

      try {
        user = await db
          .select()
          .from(usersSchema)
          .where(eq(usersSchema.id, userId))
          .limit(1);

        if (user.length === 0) {
          throw new NotFound({ error: 'User not found' });
        }
      } catch (error) {
        throw new NotFound({ error: 'User not found' });
      }

      const accessToken = sign({ id: userId }, secret, {
        expiresIn: accessTokenTime,
      });

      const refreshToken = sign(
        { id: userId, date: new Date().getTime },
        refreshSecret || secret,
        {
          expiresIn: refreshTokenTime,
        },
      );

      if (tokensSchema) {
        await db.insert(tokensSchema).values({
          accessToken,
          refreshToken,
          ownerId: userId,
        });
      }

      return {
        accessToken,
        refreshToken,
      };
    };

export const removeUserToken =
  //@ts-ignore


    ({ db, tokensSchema }) =>
    async (accessToken: string) => {
      await db
        .delete(tokensSchema)
        .where(eq(tokensSchema.accessToken, accessToken));
    };

export const removeAllUserTokens =
  //@ts-ignore


    ({ db, tokensSchema }) =>
    async (ownerId: string) => {
      await db.delete(tokensSchema).where(eq(tokensSchema.ownerId, ownerId));
    };

export const refreshUserToken =
  //@ts-ignore


    ({ db, tokensSchema }) =>
    async (
      refreshToken: string,
      {
        secret,
        refreshSecret,
        accessTokenTime,
      }: { secret: string; refreshSecret?: string; accessTokenTime: string },
    ) => {
      try {
        verify(refreshToken, refreshSecret || secret);
      } catch (error) {
        if (tokensSchema) {
          await db
            .delete(tokensSchema)
            .where(eq(tokensSchema.refreshToken, refreshToken));
        }

        throw new BadRequest({
          error: 'Token expired',
        });
      }

      let token;
      if (tokensSchema) {
        const result = await db
          .select()
          .from(tokensSchema)
          .where(eq(tokensSchema.refreshToken, refreshToken))
          .limit(1);

        if (result.length === 0) {
          throw new NotFound({
            error: 'Token not found',
          });
        } else {
          token = result[0];
        }
      } else {
        //Get Data from expired Token
      }

      // Renew Token
      const accessToken = sign({ id: token.ownerId }, secret, {
        expiresIn: accessTokenTime,
      });

      if (tokensSchema) {
        await db
          .update(tokensSchema)
          .set({
            accessToken,
          })
          .where(eq(tokensSchema.id, token.id));
      }

      return { accessToken, refreshToken };
    };

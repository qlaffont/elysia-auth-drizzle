import { beforeEach, describe, expect, it } from 'bun:test';
import { db } from './utils/db';

import { createUserToken } from '../src/utils';
import { NotFound } from 'unify-errors';
import { tokens as tokensSchema, users as usersSchema } from './utils/schema';
import { eq } from 'drizzle-orm';

describe('createUserToken 集成测试', () => {
    const userId = crypto.randomUUID();
    const secret = 'test-secret';
    const refreshSecret = 'refresh-secret';
    const accessTokenTime = '1h';
    const refreshTokenTime = '7d';

    beforeEach(async () => {
        // 清空表
        await db.delete(tokensSchema);
        await db.delete(usersSchema);
    });

    it('用户存在时，生成 token 并写入 tokens 表', async () => {
        // 插入用户
        await db.insert(usersSchema).values({ id: userId });


        const fn = createUserToken({ db, usersSchema, tokensSchema });
        const result = await fn(userId, { secret, refreshSecret, accessTokenTime, refreshTokenTime });
        // console.log(result);

        expect(result.accessToken).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();

        // 检查 tokens 表
        const tokens = await db.select().from(tokensSchema).where(eq(tokensSchema.ownerId, userId));
        console.log("tokens", tokens);
        expect(tokens.length).toBe(1);
        expect(tokens[0].accessToken).toBe(result.accessToken);
        expect(tokens[0].refreshToken).toBe(result.refreshToken);

    });

    it('用户不存在时，抛出 NotFound', async () => {
        const fn = createUserToken({ db, usersSchema, tokensSchema });
        await expect(fn(userId, { secret, refreshSecret, accessTokenTime, refreshTokenTime }))
            .rejects.toThrow(NotFound);
    });

    it('tokensSchema 不传时，不写入 tokens 表', async () => {
        // 插入用户
        await db.insert(usersSchema).values({ id: userId });

        const fn = createUserToken({ db, usersSchema });
        const result = await fn(userId, { secret, refreshSecret, accessTokenTime, refreshTokenTime });

        expect(result.accessToken).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();

        // tokens 表应无数据
        const tokens = await db.select().from(tokensSchema).where(eq(tokensSchema.ownerId, userId));
        expect(tokens.length).toBe(0);
    });
});
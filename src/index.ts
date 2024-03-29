import {
  elysiaAuthDrizzlePlugin as plugin,
  getAccessTokenFromRequest as GetAccessTokenFromRequest,
  Options,
} from './elysia-auth-plugin';
import { UrlConfig } from './type';
import {
  createUserToken as CreateUserToken,
  refreshUserToken as RefreshUserToken,
  removeAllUserTokens as RemoveAllUserTokens,
  removeUserToken as RemoveUserToken,
} from './utils';

export const createUserToken = CreateUserToken;
export const refreshUserToken = RefreshUserToken;
export const removeAllUserTokens = RemoveAllUserTokens;
export const removeUserToken = RemoveUserToken;
export const elysiaAuthDrizzlePlugin = plugin;
export const getAccessTokenFromRequest = GetAccessTokenFromRequest;
export type ElysiaUrlConfig = UrlConfig;
export type ElysiaAuthDrizzlePluginConfig<T> = Options<T>;

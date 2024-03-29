/**
 * @jest-environment node
 */

import { describe, expect, it } from 'bun:test';

import { ElysiaAuthDrizzlePluginConfig } from '../src';
import { currentUrlAndMethodIsAllowed } from '../src/currentUrlAndMethodIsAllowed';

describe('currentUrlAndMethodIsAllowed', () => {
  it('should validate url with method', async () => {
    const config: ElysiaAuthDrizzlePluginConfig<unknown>['config'] = [
      {
        url: '/test',
        method: 'GET',
      },
    ];

    expect(currentUrlAndMethodIsAllowed('/test', 'GET', config)).toBe(true);
  });

  it('should validate url with slash at the end', async () => {
    const config: ElysiaAuthDrizzlePluginConfig<unknown>['config'] = [
      {
        url: '/test',
        method: 'GET',
      },
    ];

    expect(currentUrlAndMethodIsAllowed('/test/', 'GET', config)).toBe(true);
  });

  it('should validate url with any at the end', async () => {
    const config: ElysiaAuthDrizzlePluginConfig<unknown>['config'] = [
      {
        url: '/test/*',
        method: 'GET',
      },
    ];

    expect(
      currentUrlAndMethodIsAllowed('/test/ceciestyntest', 'GET', config),
    ).toBe(true);
  });

  it('should validate with several param', async () => {
    const config: ElysiaAuthDrizzlePluginConfig<unknown>['config'] = [
      {
        url: '/test/:test2/:test3/test',
        method: 'GET',
      },
    ];

    expect(
      currentUrlAndMethodIsAllowed('/test/:test2/:test3/test', 'GET', config),
    ).toBe(true);

    expect(
      currentUrlAndMethodIsAllowed('/test/:test2/:test3/wrong', 'GET', config),
    ).toBe(false);
  });
});

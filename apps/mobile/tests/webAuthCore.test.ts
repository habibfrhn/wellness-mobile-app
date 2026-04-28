import assert from 'node:assert/strict';
import test from 'node:test';

import { getWebAppOriginForContext, getWebAuthPathFromPathname, isAllowedWebOriginWithEnv } from '../src/services/webAuthCore.ts';

test('webAuthCore enforces origin allowlist', () => {
  const env = 'https://lumepo.com,https://preview.example.com';
  assert.equal(isAllowedWebOriginWithEnv('https://preview.example.com', env), true);
  assert.equal(isAllowedWebOriginWithEnv('https://malicious.example', env), false);
});

test('webAuthCore derives origin by context and production constraints', () => {
  assert.equal(
    getWebAppOriginForContext({
      nodeEnv: 'development',
      configuredOrigin: 'https://lumepo.com',
      detectedOrigin: null,
      allowedOriginsEnv: 'https://lumepo.com',
    }),
    'https://lumepo.com',
  );

  assert.equal(
    getWebAppOriginForContext({
      nodeEnv: 'production',
      configuredOrigin: 'https://bad.example',
      detectedOrigin: null,
      allowedOriginsEnv: 'https://lumepo.com',
    }),
    null,
  );
});

test('webAuthCore normalizes auth callback/reset paths', () => {
  assert.equal(getWebAuthPathFromPathname('/auth/callback'), 'callback');
  assert.equal(getWebAuthPathFromPathname('/--/auth/reset'), 'reset');
  assert.equal(getWebAuthPathFromPathname('/random'), null);
});

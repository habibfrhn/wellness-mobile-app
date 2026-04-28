import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPasswordRequirementChecks,
  getResetLinkErrorType,
  getSafeAuthErrorMessageCore,
  isEmailAlreadyRegisteredError,
  isInvalidCredentialsError,
  isRateLimitedError,
  isValidPassword,
  isValidPasswordLength,
  isWeakPasswordError,
} from '../src/services/authSecurityCore.ts';

test('authSecurity validates password requirements', () => {
  assert.equal(isValidPasswordLength('Ab1!abcd'), true);
  assert.equal(isValidPasswordLength('short1!'), false);
  assert.equal(isValidPassword('Ab1!abcd'), true);
  assert.equal(isValidPassword('NoSpecialAB1'), false);

  assert.deepEqual(getPasswordRequirementChecks('Ab1!abcd'), {
    minLength: true,
    maxLength: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
});

test('authSecurity maps auth and reset errors', () => {
  assert.equal(isEmailAlreadyRegisteredError('User already registered'), true);
  assert.equal(isRateLimitedError('over_request_rate_limit'), true);
  assert.equal(isWeakPasswordError('password must contain symbol'), true);
  assert.equal(isInvalidCredentialsError('Invalid login credentials'), true);

  assert.equal(getResetLinkErrorType('flow_state_expired'), 'expired');
  assert.equal(getResetLinkErrorType('flow state not found'), 'used');
  assert.equal(getResetLinkErrorType('invalid token'), 'invalid');
  assert.equal(getResetLinkErrorType('some unexpected error'), 'unknown');

  assert.equal(getSafeAuthErrorMessageCore('network timeout', 'fallback', 'Coba lagi.'), 'Coba lagi.');
});

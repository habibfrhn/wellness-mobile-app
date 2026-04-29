import {
  getResetLinkErrorType,
  getSafeAuthErrorMessage,
  isEmailAlreadyRegisteredError,
  isInvalidCredentialsError,
  isValidPassword,
  isValidPasswordLength,
  isWeakPasswordError,
} from '../authSecurity';

describe('authSecurity', () => {
  it('validates password policy and boundaries', () => {
    expect(isValidPasswordLength('Ab1!abcd')).toBe(true);
    expect(isValidPasswordLength('short1!')).toBe(false);
    expect(isValidPassword('Ab1!abcd')).toBe(true);
    expect(isValidPassword('alllowercase1!')).toBe(false);
  });

  it('maps auth errors to safe UX messages and form errors', () => {
    expect(isEmailAlreadyRegisteredError('User already registered')).toBe(true);
    expect(isInvalidCredentialsError('invalid login credentials')).toBe(true);
    expect(isWeakPasswordError('Password is too weak')).toBe(true);
    expect(getSafeAuthErrorMessage('network timeout', 'fallback')).toBe('Please try again.');
  });

  it('classifies reset password edge cases', () => {
    expect(getResetLinkErrorType('otp_expired')).toBe('expired');
    expect(getResetLinkErrorType('flow_state_not_found already used')).toBe('used');
    expect(getResetLinkErrorType('invalid token')).toBe('invalid');
  });
});

const EMAIL_EXISTS_MARKERS = ["already registered", "already been registered", "user already registered", "already exists"];
const RATE_LIMIT_MARKERS = ["rate limit", "too many", "over_email_send_rate_limit", "over_request_rate_limit"];
const NETWORK_MARKERS = ["network", "fetch", "timeout", "timed out"];
const WEAK_PASSWORD_MARKERS = ["weak password", "password should", "password must", "password is too weak"];
const EMAIL_NOT_CONFIRMED_MARKERS = ["email not confirmed", "confirm your email", "email_not_confirmed", "signup_disabled"];

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export function isValidPasswordLength(value: string) {
  const length = value.length;
  return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
}

export function getPasswordRequirementChecks(value: string) {
  return {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    maxLength: value.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export function isValidPassword(value: string) {
  const checks = getPasswordRequirementChecks(value);
  return checks.minLength && checks.maxLength && checks.uppercase && checks.lowercase && checks.number && checks.special;
}

export function isEmailAlreadyRegisteredError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return EMAIL_EXISTS_MARKERS.some((marker) => normalized.includes(marker));
}

export function isRateLimitedError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return RATE_LIMIT_MARKERS.some((marker) => normalized.includes(marker));
}

export function isNetworkLikeError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return NETWORK_MARKERS.some((marker) => normalized.includes(marker));
}

export function isWeakPasswordError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return WEAK_PASSWORD_MARKERS.some((marker) => normalized.includes(marker));
}

export function getSafeAuthErrorMessage(message: string | null | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  if (isRateLimitedError(message)) {
    return fallback;
  }

  if (isNetworkLikeError(message)) {
    return fallback;
  }

  return fallback;
}

export function isEmailNotConfirmedError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return EMAIL_NOT_CONFIRMED_MARKERS.some((marker) => normalized.includes(marker));
}

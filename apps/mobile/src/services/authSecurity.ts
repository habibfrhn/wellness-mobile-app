import { id } from "../i18n/strings";

const EMAIL_EXISTS_MARKERS = ["already registered", "already been registered", "user already registered", "already exists"];
const RATE_LIMIT_MARKERS = ["rate limit", "too many", "over_email_send_rate_limit", "over_request_rate_limit"];
const NETWORK_MARKERS = ["network", "fetch", "timeout", "timed out"];
const WEAK_PASSWORD_MARKERS = ["weak password", "password should", "password must", "password is too weak"];
const EMAIL_NOT_CONFIRMED_MARKERS = ["email not confirmed", "confirm your email", "email_not_confirmed", "signup_disabled"];
const INVALID_CREDENTIALS_MARKERS = ["invalid login credentials", "invalid credentials", "email or password", "invalid_grant"];
const RESET_LINK_EXPIRED_MARKERS = ["expired", "otp_expired", "flow_state_expired", "flow state has expired"];
const RESET_LINK_USED_MARKERS = ["already", "used", "flow state not found", "flow_state_not_found"];
const RESET_LINK_INVALID_MARKERS = ["invalid", "not found", "session", "jwt", "token"];

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
  if (isNetworkLikeError(message) || isRateLimitedError(message)) {
    return id.common.tryAgain;
  }

  return fallback;
}

export function isEmailNotConfirmedError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return EMAIL_NOT_CONFIRMED_MARKERS.some((marker) => normalized.includes(marker));
}

export function isInvalidCredentialsError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return INVALID_CREDENTIALS_MARKERS.some((marker) => normalized.includes(marker));
}

export function getResetLinkErrorType(message: string | null | undefined): "expired" | "used" | "invalid" | "unknown" {
  const normalized = (message ?? "").toLowerCase();
  if (!normalized) {
    return "unknown";
  }

  if (RESET_LINK_EXPIRED_MARKERS.some((marker) => normalized.includes(marker))) {
    return "expired";
  }

  if (RESET_LINK_USED_MARKERS.some((marker) => normalized.includes(marker))) {
    return "used";
  }

  if (RESET_LINK_INVALID_MARKERS.some((marker) => normalized.includes(marker))) {
    return "invalid";
  }

  return "unknown";
}

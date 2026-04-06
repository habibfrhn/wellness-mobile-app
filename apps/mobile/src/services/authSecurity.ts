const EMAIL_EXISTS_MARKERS = ["already registered", "already been registered", "user already registered", "already exists"];
const RATE_LIMIT_MARKERS = ["rate limit", "too many", "over_email_send_rate_limit", "over_request_rate_limit"];
const NETWORK_MARKERS = ["network", "fetch", "timeout", "timed out"];

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function isValidPasswordLength(value: string) {
  const length = value.length;
  return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
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

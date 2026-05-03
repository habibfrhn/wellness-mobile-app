const SUCCESS_COOLDOWN_SECONDS = 15;
const RATE_LIMIT_COOLDOWN_SECONDS = 60;

const cooldownStateByEmail = new Map<string, number>();

function nowMs() {
  return Date.now();
}

function toDeadline(seconds: number) {
  return nowMs() + seconds * 1000;
}

export function getForgotPasswordCooldownSeconds(email: string) {
  const deadlineMs = cooldownStateByEmail.get(email);
  if (!deadlineMs) {
    return 0;
  }

  const remainingSeconds = Math.ceil((deadlineMs - nowMs()) / 1000);
  if (remainingSeconds <= 0) {
    cooldownStateByEmail.delete(email);
    return 0;
  }

  return remainingSeconds;
}

export function setForgotPasswordSuccessCooldown(email: string, seconds: number = SUCCESS_COOLDOWN_SECONDS) {
  cooldownStateByEmail.set(email, toDeadline(Math.max(1, seconds)));
}

export function setForgotPasswordRateLimitCooldown(email: string, seconds: number = RATE_LIMIT_COOLDOWN_SECONDS) {
  cooldownStateByEmail.set(email, toDeadline(Math.max(1, seconds)));
}

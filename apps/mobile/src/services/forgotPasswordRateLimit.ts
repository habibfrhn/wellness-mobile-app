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

export function setForgotPasswordSuccessCooldown(email: string) {
  cooldownStateByEmail.set(email, toDeadline(SUCCESS_COOLDOWN_SECONDS));
}

export function setForgotPasswordRateLimitCooldown(email: string) {
  cooldownStateByEmail.set(email, toDeadline(RATE_LIMIT_COOLDOWN_SECONDS));
}

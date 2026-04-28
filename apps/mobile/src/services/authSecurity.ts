import { id } from "../i18n/strings";
import {
  getPasswordRequirementChecks,
  getResetLinkErrorType,
  getSafeAuthErrorMessageCore,
  isEmailAlreadyRegisteredError,
  isEmailNotConfirmedError,
  isInvalidCredentialsError,
  isNetworkLikeError,
  isRateLimitedError,
  isValidPassword,
  isValidPasswordLength,
  isWeakPasswordError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./authSecurityCore";

export {
  getPasswordRequirementChecks,
  getResetLinkErrorType,
  isEmailAlreadyRegisteredError,
  isEmailNotConfirmedError,
  isInvalidCredentialsError,
  isNetworkLikeError,
  isRateLimitedError,
  isValidPassword,
  isValidPasswordLength,
  isWeakPasswordError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
};

export function getSafeAuthErrorMessage(message: string | null | undefined, fallback: string) {
  return getSafeAuthErrorMessageCore(message, fallback, id.common.tryAgain);
}

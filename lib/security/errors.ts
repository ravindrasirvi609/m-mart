export class SecurityError extends Error {
  constructor(message = "Security validation failed.") {
    super(message);
    this.name = "SecurityError";
  }
}

export class AuthError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthError";
  }
}

export function toPublicErrorMessage(
  error: unknown,
  fallback = "Request failed. Please try again.",
) {
  if (error instanceof SecurityError) {
    return error.message;
  }

  if (error instanceof AuthError) {
    return error.message;
  }

  return fallback;
}

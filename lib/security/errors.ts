export class SecurityError extends Error {
  constructor(message = "Security validation failed.") {
    super(message);
    this.name = "SecurityError";
  }
}

export function toPublicErrorMessage(
  error: unknown,
  fallback = "Request failed. Please try again.",
) {
  if (error instanceof SecurityError) {
    return error.message;
  }

  return fallback;
}

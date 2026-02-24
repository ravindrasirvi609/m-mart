type LoginAttemptState = {
  count: number;
  windowStartedAt: number;
  lockedUntil: number;
};

type SeenIpState = {
  seenAt: number;
};

const DEFAULT_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LOCK_WINDOW_MS = 30 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;
const SUSPICIOUS_LOGIN_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUSPICIOUS_UNIQUE_IP_THRESHOLD = 3;

const loginAttempts = new Map<string, LoginAttemptState>();
const loginIpsByEmail = new Map<string, Map<string, SeenIpState>>();

function cleanupStaleEntries(now: number) {
  for (const [identifier, entry] of loginAttempts.entries()) {
    const windowExpired = now - entry.windowStartedAt > DEFAULT_FAILURE_WINDOW_MS;
    const lockExpired = entry.lockedUntil !== 0 && now > entry.lockedUntil;

    if ((windowExpired && lockExpired) || (windowExpired && entry.lockedUntil === 0)) {
      loginAttempts.delete(identifier);
    }
  }

  for (const [email, seenIps] of loginIpsByEmail.entries()) {
    for (const [ip, state] of seenIps.entries()) {
      if (now - state.seenAt > SUSPICIOUS_LOGIN_WINDOW_MS) {
        seenIps.delete(ip);
      }
    }

    if (seenIps.size === 0) {
      loginIpsByEmail.delete(email);
    }
  }
}

export function getAuthLockState(identifier: string) {
  const now = Date.now();
  cleanupStaleEntries(now);

  const state = loginAttempts.get(identifier);
  if (!state || state.lockedUntil === 0 || now >= state.lockedUntil) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - now) / 1000)),
  };
}

export function registerAuthFailure(identifier: string) {
  const now = Date.now();
  cleanupStaleEntries(now);

  const state = loginAttempts.get(identifier);
  if (!state || now - state.windowStartedAt > DEFAULT_FAILURE_WINDOW_MS) {
    loginAttempts.set(identifier, {
      count: 1,
      windowStartedAt: now,
      lockedUntil: 0,
    });

    return {
      locked: false,
      attempts: 1,
      retryAfterSeconds: 0,
    };
  }

  state.count += 1;

  if (state.count >= DEFAULT_MAX_ATTEMPTS) {
    state.lockedUntil = now + DEFAULT_LOCK_WINDOW_MS;

    return {
      locked: true,
      attempts: state.count,
      retryAfterSeconds: Math.ceil(DEFAULT_LOCK_WINDOW_MS / 1000),
    };
  }

  return {
    locked: false,
    attempts: state.count,
    retryAfterSeconds: 0,
  };
}

export function registerAuthSuccess(identifier: string) {
  loginAttempts.delete(identifier);
}

export function detectSuspiciousLogin(email: string, ip: string) {
  const now = Date.now();
  cleanupStaleEntries(now);

  if (!email || !ip || ip === "unknown") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  let seenIps = loginIpsByEmail.get(normalizedEmail);

  if (!seenIps) {
    seenIps = new Map<string, SeenIpState>();
    loginIpsByEmail.set(normalizedEmail, seenIps);
  }

  seenIps.set(ip, { seenAt: now });

  return seenIps.size >= SUSPICIOUS_UNIQUE_IP_THRESHOLD;
}

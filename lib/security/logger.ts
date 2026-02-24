const shouldLog = process.env.NODE_ENV !== "production";

type LogArgs = Parameters<typeof console.log>;

type LoggerMethod = (...args: LogArgs) => void;

const noop: LoggerMethod = () => {
  // Intentionally empty to avoid leaking debug data in production logs.
};

function maybe(method: LoggerMethod): LoggerMethod {
  return shouldLog ? method : noop;
}

export const logger = {
  debug: maybe(console.debug.bind(console)),
  info: maybe(console.info.bind(console)),
  warn: maybe(console.warn.bind(console)),
  error: maybe(console.error.bind(console)),
};

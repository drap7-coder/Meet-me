type LogContext = Record<string, unknown>;

function writeLog(level: "error" | "warn" | "info", route: string, message: string, context?: LogContext) {
  console[level](
    JSON.stringify({
      level,
      route,
      message,
      ts: new Date().toISOString(),
      ...context
    })
  );
}

export function logApiError(route: string, error: unknown, context?: LogContext) {
  writeLog("error", route, error instanceof Error ? error.message : String(error), {
    ...context,
    stack: error instanceof Error ? error.stack : undefined
  });
}

export function logApiWarn(route: string, message: string, context?: LogContext) {
  writeLog("warn", route, message, context);
}

export function logSearchInfo(context: LogContext) {
  console.info(
    JSON.stringify({
      level: "info",
      event: "search_telemetry",
      ts: new Date().toISOString(),
      ...context
    })
  );
}

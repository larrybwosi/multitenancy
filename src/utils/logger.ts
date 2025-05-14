export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export function log(level: LogLevel, message: string, context?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] ${message}`;

  if (context) {
    console.log(logMessage, JSON.stringify(context, null, 2));
  } else {
    console.log(logMessage);
  }

  // In a production environment, you might send logs to a dedicated service
}

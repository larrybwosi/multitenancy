// logger.ts

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] - ${message}${data ? ` | Data: ${JSON.stringify(data, null, 2)}` : ''}\n`;

  console.log(logMessage.trim()); // Also log to console

}

export const logger = {
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
};

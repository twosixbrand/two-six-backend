import { LoggerService, Logger } from '@nestjs/common';

// Redirect global console methods during tests
if (process.env.NODE_ENV === 'test') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  global.console.warn = jest.fn();
  global.console.error = jest.fn();
}

/**
 * A silent logger for tests to keep the console clean.
 */
export class SilentLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {}
  error(message: any, ...optionalParams: any[]) {}
  warn(message: any, ...optionalParams: any[]) {}
  debug?(message: any, ...optionalParams: any[]) {}
  verbose?(message: any, ...optionalParams: any[]) {}
  fatal?(message: any, ...optionalParams: any[]) {}
  setLogLevels?(levels: any[]) {}
}

// Silence NestJS Logger
if (process.env.NODE_ENV === 'test') {
  Logger.overrideLogger(new SilentLogger());
}

import pino from 'pino'
import type { LoggerOptions } from 'pino'
import { config } from '../config/index.js'

export const loggerConfig: LoggerOptions = {
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
}

export const logger = pino(loggerConfig)

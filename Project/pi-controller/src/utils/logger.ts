import winston from 'winston';
import path from 'path';

export class Logger {
  private static instance: winston.Logger;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      const logLevel = process.env.LOG_LEVEL || 'info';
      const logFile = process.env.LOG_FILE || './logs/pi-controller.log';

      Logger.instance = winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          winston.format.json()
        ),
        transports: [
          new winston.transports.File({ filename: logFile }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ level, message, timestamp, ...meta }) => {
                  let msg = `${timestamp} [${level}]: ${message}`;
                  if (Object.keys(meta).length > 0) {
                    msg += ` ${JSON.stringify(meta)}`;
                  }
                  return msg;
                }
              )
            ),
          }),
        ],
      });
    }

    return Logger.instance;
  }
}

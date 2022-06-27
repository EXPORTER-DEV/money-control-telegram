import { pino } from 'pino';

export default pino({
    name: process.env.npm_package_name,
    level: 'debug',
    version: process.env.npm_package_version,
}) as ILogger;

export interface ILogger {
    warn(mergingObject: Record<string, any>, message: string): void;
    warn(message: string): void,
    info(mergingObject: Record<string, any>, message: string): void;
    info(message: string): void,
    error(mergingObject: Record<string, any>, message: string): void;
    error(message: string): void,
    debug(mergingObject: Record<string, any>, message: string): void;
    debug(message: string): void,
    child(options: Record<string, any>): ILogger;
}
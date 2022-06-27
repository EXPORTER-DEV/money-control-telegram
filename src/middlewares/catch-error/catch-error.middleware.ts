import { Context } from "telegraf";
import { ILogger } from "../../lib/logger/logger";

/**
 * Middleware that catch and log all erros, that throws 
 * bottom from injecting this middleware
 */
export class CatchErrorMiddleware {
    readonly logger: ILogger;
    constructor(logger: ILogger){
        this.logger = logger.child({module: 'CatchErrorMiddleware'});
    }
    init(){
        return async (ctx: Context, next: () => void) => {
            try {
                await next();
            } catch (e: any) {
                this.logger.error({stack: e.stack!}, 'Got error while bot handling');
            }
        };
    }
}
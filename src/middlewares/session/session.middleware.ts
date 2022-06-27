import { Context } from "telegraf";
import Redis from 'ioredis';
import { Config, IConfig, ISessionContext } from "./session.interface";
import { ILogger } from "../../lib/logger/logger";

export class SessionMiddleware {
    connection: Redis;
    key: string;
    logger: ILogger;
    constructor(data: IConfig, logger: ILogger){
        this.logger = logger.child({module: 'SessionMiddleware'});
        this.logger.info('Constructing');
        const config = new Config(data);
        this.key = config.key;
        this.connection = new Redis({
            username: config.connection.username,
            password: config.connection.password,
            host: config.connection.host,
            port: config.connection.port,
            db: config.connection.database,
            retryStrategy(times) {
                if(times > config.connection.maxRetries!){
                    const delay = config.connection.reconnectDelay!;
                    return delay;
                }else{
                    return null;
                }
            },
        });
        this.connection.on('connect', () => {
            this.logger.info('Redis connected successfully.');
        });
        this.connection.on('error', (e: Error) => {
            this.logger.error({error: e.stack}, 'Got redis error');
        });
        this.connection.on('close', () => {
            this.logger.info('Redis closed connection');
        });
    }
    generateKey(userId: number): string {
        return `${this.key}:${userId}`;
    }
    async get(userId: number): Promise<ISessionContext> {
        const key = this.generateKey(userId);
        let result = null;
        try {
            result = await this.connection.get(key);
        }catch(e: any){
            this.logger.warn({error: e.stack, key}, `Failed read session for userId: ${userId}`);
        }
        if(result !== null){
            try {
                return JSON.parse(result) as ISessionContext;
            } catch (e: any) {
                this.logger.warn({error: e.stack, key}, `Failed to parse session for userId: ${userId}`);
            }
        }
        return {} as ISessionContext;
    }
    async set(userId: number, value: Record<string, any>): Promise<void> {
        const key = this.generateKey(userId);
        try {
            const res = await this.connection.set(key, JSON.stringify(value));
            if(res !== 'OK'){
                throw new Error(`Result: ${res}`);
            }
        } catch (e: any) {
            this.logger.warn({error: e.stack!, key}, `Failed set session for userId: ${userId}`);
        }
    }
    init(){
        return async (ctx: ISessionContext, next: Function) => {
            if(ctx.from){
                const session = await this.get(ctx.from.id);
                ctx.session = session;
                await next();
                await this.set(ctx.from.id, ctx.session);
            }else{
                await next();
            }
        }
    }
}
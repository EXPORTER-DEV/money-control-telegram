import { IConfig } from "./config.interface";

export const Config = (): IConfig => {
    return {
        redis: {
            port: parseInt(process.env.REDIS_PORT!) || 0,
            host: process.env.REDIS_HOST!,
            username: process.env.REDIS_USERNAME!,
            password: process.env.REDIS_PASSWORD!,
            database: parseInt(process.env.REDIS_DATABASE!) || 0,
        }
    }
}
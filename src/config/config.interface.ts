export interface IConfig {
    bot_token: string;
    redis: {
        port: number;
        host: string;
        username: string;
        password: string;
        database: number;
    },
    mongo: {
        port: number,
        host: string;
        username: string;
        password: string;
        database: string;
    }
}
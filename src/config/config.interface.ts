export interface IConfig {
    redis: {
        port: number;
        host: string;
        username: string;
        password: string;
        database: number;
    }
}
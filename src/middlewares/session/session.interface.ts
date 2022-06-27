import { plainToInstance } from "class-transformer";
import { IsNumber, IsOptional, IsString, validateSync } from "class-validator";
import { Context } from "telegraf";

export interface IConfigConnection {
    port: number;
    host: string;
    username?: string;
    password: string;
    database?: number;
    maxRetries?: number;
    reconnectDelay?: number;
}

export class ConfigConnection implements IConfigConnection {
    @IsNumber()
    port: number;
    @IsString()
    host: string;
    @IsString()
    @IsOptional()
    username?: string;
    @IsString()
    password: string;
    @IsNumber()
    @IsOptional()
    database?: number = 0;
    @IsNumber()
    @IsOptional()
    maxRetries?: number = 10;
    @IsNumber()
    @IsOptional()
    reconnectDelay?: number = 1000;
}

export interface IConfig {
    connection: IConfigConnection;
    key?: string;
}

export class Config implements IConfig {
    connection: IConfigConnection;
    key: string = 'session';
    constructor(data: Partial<IConfig>) {
        if (data.connection) {
            this.connection = plainToInstance(ConfigConnection, data.connection);
            const errors = validateSync(this.connection);
            if (errors.length > 0) {
                throw new Error(`Failed validate Session config.connection: ${errors.map((item) => (`${item.property} -> ${JSON.stringify(item.constraints)}`)).join("\n")}`);
            }
        }
    }
}

export interface ISessionContext extends Context {
    session?: Record<string, any>,
}
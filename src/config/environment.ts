import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class Environment {
    // Redis start:
    @IsNumber()
    @Type(() => Number)
    REDIS_PORT: number;

    @IsString()
    REDIS_HOST: string;

    @IsString()
    @IsOptional()
    REDIS_USERNAME: string;

    @IsString()
    REDIS_PASSWORD: string;

    @IsNumber()
    @Type(() => Number)
    REDIS_DATABASE: number;

    // Mongo start:
    @IsNumber()
    @Type(() => Number)
    MONGO_PORT: number;

    @IsString()
    MONGO_HOST: string;

    @IsString()
    @IsOptional()
    MONGO_USERNAME: string;

    @IsString()
    MONGO_PASSWORD: string;

    @IsString()
    MONGO_DATABASE: number;
}
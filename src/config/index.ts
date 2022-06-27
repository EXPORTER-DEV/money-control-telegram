import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { Config } from "./config";
import { IConfig } from "./config.interface";
import { Environment } from "./environment";

export default function(): IConfig {
    const environment = plainToInstance(Environment, process.env, { enableImplicitConversion: true });
    const errors = validateSync(environment);
    if(errors.length > 0){
        throw new Error(`Failed validate environments: ${errors.map((item) => (`${item.property} -> ${JSON.stringify(item.constraints)}`)).join("\n")}`)
    }

    return Config();
}
import { BaseModel } from "../../database/models/base.model";
import { ISessionContext } from "../session/session.interface";
import { IDatabaseContext } from "./database.interface";

export class Database {
    models: Record<string, BaseModel>;
    constructor(models: Record<string, BaseModel>){
        this.models = models;
    }
    inject<T extends BaseModel>(modelName: string | any): T {
        if(typeof modelName !== "string"){
            if(modelName.name !== undefined){
                modelName = modelName.name;
            }
        }
        return this.models[modelName] as T;
    }
    init(){
        return async (ctx: IDatabaseContext, next: Function) => {
            if(ctx.from){
                ctx.database = this;
                await next();
            }else{
                await next();
            }
        }
    }
}
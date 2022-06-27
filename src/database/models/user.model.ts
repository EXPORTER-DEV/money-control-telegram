import { Model } from "mongoose";
import { BaseModel } from "./base.model";
import { IUserSchema } from "./../schemas/user.schema";

export class UserModel extends BaseModel {
    model: Model<IUserSchema>;
    constructor(model: Model<IUserSchema>){
        super(model);
    }
    async findAll(): Promise<IUserSchema[]> {
        return this.model.find({}).exec();
    }
    async findById(id: number): Promise<IUserSchema | undefined> {
        const find = await this.model.findOne({id}).exec();
        if(find !== null){
            return find;
        }
        return undefined;
    }
}
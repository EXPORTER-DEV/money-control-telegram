import { Model } from "mongoose";
import { BaseModel } from "./base.model";
import { IUserSchema } from "./../schemas/user.schema";
import { ILogger } from "../../lib/logger/logger";

export class UserModel extends BaseModel {
    model: Model<IUserSchema>;
    logger: ILogger;
    constructor(model: Model<IUserSchema>, logger: ILogger) {
        super(model, logger);
    }
    async findAll(): Promise<IUserSchema[]> {
        return this.model.find({}).exec();
    }
    async findById(id: number): Promise<IUserSchema | undefined> {
        const find = await this.model.findOne({id}).populate('accounts').exec();
        if (find !== null) {
            return find;
        }
        return undefined;
    }
}
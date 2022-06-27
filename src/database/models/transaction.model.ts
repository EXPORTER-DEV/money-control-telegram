import { Model } from "mongoose";
import { ILogger } from "../../lib/logger/logger";
import { ITransactionSchema } from "../schemas/transaction.schema";
import { BaseModel } from "./base.model";

export class TransactionModel extends BaseModel {
    model: Model<ITransactionSchema>;
    logger: ILogger;
    constructor(model: Model<ITransactionSchema>, logger: ILogger){
        super(model, logger);
    }
    async findAll(): Promise<ITransactionSchema[]> {
        return this.model.find({}).exec();
    }
}
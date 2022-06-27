import mongoose, { Document, PopulatedDoc, Types } from "mongoose";
import { ITransactionSchema } from "./transaction.schema";
import { IUserSchema } from "./user.schema";

const Schema = mongoose.Schema;

export enum AccountTypeEnum {
    PURPOSE = 'purpose',
    ACCUMULATIVE = 'accumulative',
}

export interface IAccountSchema {
    _id: Types.ObjectId,
    user: PopulatedDoc<Document<Types.ObjectId> & IUserSchema>;
    type: AccountTypeEnum;
    name: string;
    transactions: Types.ObjectId[] | ITransactionSchema[];
}

export const AccountSchema = new Schema<IAccountSchema>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        default: AccountTypeEnum.ACCUMULATIVE,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
});
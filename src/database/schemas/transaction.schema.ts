import { Schema, Types } from "mongoose";
import { IAccountSchema } from "./account.schema";

export enum TransactionTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}

export interface ITransactionSchema {
    _id: Types.ObjectId;
    account: Types.ObjectId | IAccountSchema;
    type: TransactionTypeEnum;
    amount: number;
    user: Types.ObjectId;
    createdAt: number;
    updatedAt: number;
}

export class TransactionDto implements ITransactionSchema {
    _id: Types.ObjectId;
    account: Types.ObjectId | IAccountSchema;
    type: TransactionTypeEnum;
    amount: number;
    user: Types.ObjectId;
    createdAt: number;
    updatedAt: number;
    constructor(data: ITransactionSchema) {
        Object.assign(this, {
            _id: data._id,
            account: data.account,
            type: data.type,
            amount: data.amount,
            user: data.user,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}

export const TransactionSchema = new Schema<ITransactionSchema>({
    account: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        default: TransactionTypeEnum.INCOME,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: { currentTime: () => Date.now() }
});
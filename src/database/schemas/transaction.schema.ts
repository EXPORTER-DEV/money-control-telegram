import { Schema, Types } from "mongoose";
import { IAccountSchema } from "./account.schema";

export enum TransactionTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}

export interface ITransactionSchema {
    id: Types.ObjectId;
    account: Types.ObjectId | IAccountSchema;
    type: TransactionTypeEnum;
    amount: number;
    createdAt: number;
    updatedAt: number;
}

export const TransactionSchema = new Schema<ITransactionSchema>({
    id: {
        type: Schema.Types.ObjectId,
        index: true,
        unique: true,
    },
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
}, {
    timestamps: { currentTime: () => Date.now() }
});
import { Schema, Types } from "mongoose";

export enum TransactionTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}

export interface ITransactionSchema {
    id: Types.ObjectId;
    accountId: Types.ObjectId;
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
    accountId: {
        type: Schema.Types.ObjectId,
        index: true,
        ref: 'Account',
        foreign_key: '',
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
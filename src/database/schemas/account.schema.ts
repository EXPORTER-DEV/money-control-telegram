import mongoose, { Document, PopulatedDoc, Types } from "mongoose";
import { ITransactionSchema } from "./transaction.schema";
import { IUserSchema } from "./user.schema";

const Schema = mongoose.Schema;

export enum AccountTypeEnum {
    PURPOSE = 'purpose',
    ACCUMULATIVE = 'accumulative',
}

export enum AccountCurrencyEnum {
    RUB = 'rub',
    USD = 'usd',
}

export const AccountCurrency = {
    [AccountCurrencyEnum.RUB]: '₽',
    [AccountCurrencyEnum.USD]: '$'
};

export const AccountType = {
    [AccountTypeEnum.PURPOSE]: '🎯',
    [AccountTypeEnum.ACCUMULATIVE]: '💰'
};

export interface IAccountSchema {
    _id: Types.ObjectId,
    user: PopulatedDoc<Document<Types.ObjectId> & IUserSchema>;
    type: AccountTypeEnum;
    name: string;
    transactions: Types.ObjectId[] | ITransactionSchema[];
    transactionsTotal: number;
    currency: AccountCurrencyEnum;
    purpose?: number;
}

export class AccountDto implements IAccountSchema {
    _id: Types.ObjectId;
    user: PopulatedDoc<Document<Types.ObjectId> & IUserSchema>;
    type: AccountTypeEnum;
    name: string;
    transactions: Types.ObjectId[] | ITransactionSchema[];
    transactionsTotal: number;
    currency: AccountCurrencyEnum;
    purpose: number;
    constructor(data: IAccountSchema){
        Object.assign(this, {
            ...data,
            transactionsTotal: data.transactionsTotal || 0,
            currency: data.currency || AccountCurrencyEnum.RUB,
        });
    }
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
    }],
    currency: {
        type: String,
        default: AccountCurrencyEnum.RUB,
    },
    purpose: {
        type: Number 
    }
});
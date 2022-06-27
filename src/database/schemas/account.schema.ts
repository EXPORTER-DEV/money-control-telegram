import mongoose from "mongoose";

const Schema = mongoose.Schema;

export enum AccountTypeEnum {
    PURPOSE = 'purpose',
    ACCUMULATIVE = 'accumulative',
}

export interface IAccountSchema {
  userId: number;
  type: AccountTypeEnum;
}

export const AccountSchema = new Schema<IAccountSchema>({
    userId: {
        type: Number,
        index: true,
    },
    type: {
        type: String,
        default: AccountTypeEnum.ACCUMULATIVE,
    }
});
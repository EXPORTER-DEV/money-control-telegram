import mongoose, { Document, PopulatedDoc, Types } from "mongoose";
import { IAccountSchema } from "./account.schema";

const Schema = mongoose.Schema;

export interface IUserSchema {
    _id: Types.ObjectId,
    id: number;
    rank: number;
    accounts: Types.ObjectId[] | IAccountSchema[];
}

export const UserSchema = new Schema<IUserSchema>({
    id: {
        type: Number,
        index: true,
        unique: true
    },
    rank: {
        type: Number, 
        default: 0
    },
    accounts: [{
        type: Schema.Types.ObjectId,
        ref: "Account",
    }]
});
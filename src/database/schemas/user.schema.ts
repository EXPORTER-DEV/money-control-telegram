import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IUserSchema {
  id: number;
  rank: number;
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
});
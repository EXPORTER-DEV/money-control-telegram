import { Model } from "mongoose";

export class BaseModel {
    model: Model<any>;
    constructor(model: Model<any>){
        this.model = model;
    }
}
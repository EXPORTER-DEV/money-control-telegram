import { Model } from "mongoose";
import { ILogger } from "../../lib/logger/logger";

export class BaseModel {
    model: Model<any>;
    logger: ILogger;
    constructor(model: Model<any>, logger: ILogger){
        this.model = model;
        if(this.constructor.name !== undefined){
            this.logger = logger.child({module: this.constructor.name});
        } else {
            this.logger = logger.child({module: 'BaseModel'});
        }
    }
}
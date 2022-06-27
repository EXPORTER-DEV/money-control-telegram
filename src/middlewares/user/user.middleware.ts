import { plainToInstance } from "class-transformer";
import { UserModel } from "../../database/models/user.model";
import { ILogger } from "../../lib/logger/logger";
import { IDatabaseContext } from "../database/database.interface";

export class UserMiddleware {
    logger: ILogger;
    constructor(logger: ILogger){
        this.logger = logger.child({module: 'User'});
    }
    init(){
        return async (ctx: IDatabaseContext, next: Function) => {
            if(ctx.from){
                const userModel = ctx.database!.inject<UserModel>(UserModel);
                try {
                    const find = await userModel.findById(ctx.from.id);
                    if(find !== undefined){
                        const user = new userModel.model();
                        user.id = ctx.from.id;
                        await user.save();
                        this.logger.info(`Successfully saved ${user.id} user.`);
                    }
                } catch (e: any) {
                    this.logger.error(`Failed init middleware: ${e.stack}`);
                }
            }
            await next();
        }
    }
}
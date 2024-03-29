import { UserModel } from "../../database/models/user.model";
import { ILogger } from "../../lib/logger/logger";
import { IUserContext } from "./user.interface";

export class UserMiddleware {
    logger: ILogger;
    constructor(logger: ILogger) {
        this.logger = logger.child({module: 'User'});
    }
    init() {
        return async (ctx: IUserContext, next: () => void) => {
            if (ctx.from) {
                const userModel = ctx.database!.inject<UserModel>(UserModel);
                try {
                    const find = await userModel.findById(ctx.from.id);
                    if (find === undefined) {
                        const user = new userModel.model();
                        user.id = ctx.from.id;
                        await user.save();
                        this.logger.info(`Successfully saved ${user.id} user.`);
                        ctx.user = user;
                    } else {
                        ctx.user = find;
                    }
                } catch (e: any) {
                    this.logger.error(`Failed init middleware: ${e.stack}`);
                }
            }
            await next();
        };
    }
}
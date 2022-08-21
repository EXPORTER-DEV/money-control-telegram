import { Context } from "telegraf";
import { IUserSchema } from "../database/schemas/user.schema";
import DatabaseMiddleware from "../middlewares/database";
import { ISceneController } from "../middlewares/scene/scene.interface";

export interface IContext extends Context {
    session: Record<string, any>;
    scene: ISceneController;
    database: DatabaseMiddleware;
    textQuery?: string;
    user: IUserSchema;
}
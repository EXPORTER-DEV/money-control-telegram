import { Context } from "telegraf";
import DatabaseMiddleware from "../middlewares/database";
import { SceneController } from "../middlewares/scene/scene.middleware";

export interface IContext extends Context {
    session: Record<string, any>;
    scene: SceneController;
    database: DatabaseMiddleware;
}
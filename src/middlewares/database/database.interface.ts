import { Context } from "telegraf";
import { DatabaseMiddleware } from "./database.middleware";

export interface IDatabaseContext extends Context {
    database?: DatabaseMiddleware;
}
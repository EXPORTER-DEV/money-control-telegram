import { Context } from "telegraf";

export interface IContext extends Context {
    session: Record<string, any>;
}
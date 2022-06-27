import { Context } from "telegraf";
import { Database } from "./database";

export interface IDatabaseContext extends Context {
    database?: Database;
}
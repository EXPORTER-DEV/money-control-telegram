import { Context } from "telegraf";

export interface ITextQueryContext extends Context {
    textQuery?: string;
}
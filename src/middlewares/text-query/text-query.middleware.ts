import { TEXT_QUERY } from "../../navigation/text-query";
import { ITextQueryContext } from "./text-query.interface";

/**
 * Transorm ctx.callbackQuery to ctx.callbackTextQuery parameter
 * also creates ctx.callbackTextQuery transormed from ctx.message.text command
 * @param ctx 
 * @param next 
 * @returns 
 */
export const TextQueryMiddleware = async (ctx: ITextQueryContext, next: () => void) => {
    if(ctx.from){
        if(ctx.callbackQuery){
            ctx.textQuery = ctx.callbackQuery.data;
        }
        if(ctx.message === undefined || !('text' in ctx.message)) return next();
        if(ctx.message && TEXT_QUERY[ctx.message.text] !== undefined){
            ctx.textQuery = TEXT_QUERY[ctx.message.text];
        }
    }
    return next();
};
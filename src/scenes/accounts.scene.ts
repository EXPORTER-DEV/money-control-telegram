import { Markup } from "telegraf";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { AccountModel } from "../database/models/account.model";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { SCENE_QUERY } from "../navigation/scene-query";

const pageLimit = 10;

export const AccountsScene = new Scene(
    {
        name: SCENE_QUERY.accounts,
        startQuery: [SCENE_QUERY.accounts, '/accounts'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
    }),
    Scene.exited(async (ctx) => {
        await ctx.scene.join(SCENE_QUERY.home);
    }),
    Scene.callback(async (ctx) => {
        if(ctx.textQuery === SCENE_QUERY.pagination_close){
            await ctx.scene.exit();
            return;
        }
    }),
    Scene.default(async (ctx) => {
        const accountModel = ctx.database.inject<AccountModel>(AccountModel);
        if(ctx.textQuery !== undefined){
            //
            const offset = ctx.session.scene.offset;
            const count = ctx.session.scene.count;
            if(ctx.textQuery === SCENE_QUERY.pagination_back && offset !== undefined && count !== undefined){
                if(offset - pageLimit >= 0){
                    ctx.session.scene.offset -= pageLimit;
                }else{
                    await ctx.answerCbQuery('No previous pages.').catch();
                    return;
                }
            }
            if(ctx.textQuery === SCENE_QUERY.pagination_next && offset !== undefined && count !== undefined){
                if(offset + pageLimit <= count){
                    ctx.session.scene.offset += pageLimit;
                }else{
                    await ctx.answerCbQuery('No next pages.').catch();
                    return;
                }
            }
            const currentPage = Math.ceil((ctx.session.scene.offset + pageLimit) / pageLimit);
            const maxPage = Math.ceil(count / pageLimit);
            if(count !== undefined && offset !== undefined && currentPage > maxPage){
                ctx.session.scene.offset = Math.floor((count - pageLimit) / pageLimit);
            }
            if(ctx.textQuery.indexOf('/account') === 0){
                //
                return;
            }
        }
        if(ctx.session.scene.offset === undefined){
            ctx.session.scene.offset = 0;
        }
        const accounts = await accountModel.findAllByUserId(ctx.user._id, ctx.session.scene.offset, pageLimit);

        const buttons: InlineKeyboardButton[][] = [];
        const pageAccountButtons = accounts.items.map(account => Markup.button.callback(`${account.name} **[${account.type}]**`, `/account ${account._id}`));
        if(accounts.count === 0){
            buttons.push(
                [BUTTON.CREATE_NEW],
                [BUTTON.PAGINATION_CLOSE]
            );
        }else{
            buttons.push(...pageAccountButtons.map(button => ([button])));
            buttons.push([BUTTON.CREATE_NEW]);
            const paginationControl: InlineKeyboardButton[] = [];
            paginationControl.push(BUTTON.PAGINATION_BACK);
            paginationControl.push(BUTTON.PAGINATION_CLOSE);
            buttons.push(paginationControl);
        }
        const currentPage = Math.ceil((ctx.session.scene.offset + pageLimit) / pageLimit);
        const maxPage = Math.ceil(accounts.count / pageLimit);
        const messageContent: [string, Markup.Markup<InlineKeyboardMarkup>] = [
            `Page ${currentPage}/${maxPage}`, 
            Markup.inlineKeyboard(buttons),
        ];
        if(ctx.textQuery !== undefined && ctx.session.scene.count !== undefined){
            await ctx.editMessageText(...messageContent).catch();
        }else{
            await ctx.reply(...messageContent).catch();
        }
        if(accounts.count > 0){
            ctx.session.scene.count = accounts.count;
        }
    }),
);
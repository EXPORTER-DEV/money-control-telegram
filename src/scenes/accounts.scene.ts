import { Markup } from "telegraf";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { SCENE_QUERY } from "../navigation/scene-query";

const pageLimit = 6;

export const AccountsScene = new Scene(
    {
        name: SCENE_QUERY.accounts,
        startQuery: [SCENE_QUERY.accounts, '/accounts'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
    }),
    Scene.callback(async (ctx) => {
        if (ctx.textQuery === SCENE_QUERY.pagination_close) {
            await ctx.scene.join(SCENE_QUERY.home);
            return;
        }
    }),
    Scene.default(async (ctx) => {
        const accountModel = ctx.database.inject<AccountModel>(AccountModel);
        ctx.session.scene.options = ctx.session.scene.options || {};
        const sceneOptions = ctx.session.scene.options;
        if (ctx.textQuery !== undefined) {
            //
            const offset = sceneOptions.offset;
            const count = sceneOptions.count;
            if (ctx.textQuery === SCENE_QUERY.pagination_back && offset !== undefined && count !== undefined) {
                if (offset - pageLimit >= 0) {
                    sceneOptions.offset -= pageLimit;
                } else {
                    await ctx.answerCbQuery('No previous pages.').catch();
                    return;
                }
            }
            if (ctx.textQuery === SCENE_QUERY.pagination_next && offset !== undefined && count !== undefined) {
                if (offset + pageLimit <= count) {
                    sceneOptions.offset += pageLimit;
                } else {
                    await ctx.answerCbQuery('No next pages.').catch();
                    return;
                }
            }
            const currentPage = Math.ceil((sceneOptions.offset + pageLimit) / pageLimit);
            const maxPage = Math.ceil(count / pageLimit);
            if (count !== undefined && offset !== undefined && currentPage > maxPage) {
                sceneOptions.offset = Math.floor((count - pageLimit) / pageLimit);
            }
            if (ctx.textQuery.indexOf('/account') === 0) {
                //
                return;
            }
            if (ctx.textQuery === SCENE_QUERY.create_new) {
                await ctx.scene.join(SCENE_QUERY.manage_account, {creation: true, referer: SCENE_QUERY.accounts});
                return;
            }
        }
        if (sceneOptions.offset === undefined) {
            sceneOptions.offset = 0;
        }
        const accounts = await accountModel.findAllByUserId(ctx.user._id, sceneOptions.offset, pageLimit);

        const buttons: InlineKeyboardButton[][] = [];
        const pageAccountButtons = accounts.items
            .map(account => 
                Markup.button.callback(
                    `${AccountType[account.type]} - ${account.name} - ${account.transactionsTotal} ${account.type === AccountTypeEnum.PURPOSE && account.purpose ? `/ ${account.purpose} (${Math.round((account.transactionsTotal/account.purpose)*100)}%)` : ``} ${AccountCurrency[account.currency]}`, 
                    `/account ${account._id}`
                )
            );
        if (accounts.count === 0) {
            buttons.push(
                [BUTTON.CREATE_NEW],
                [BUTTON.PAGINATION_CLOSE]
            );
        } else {
            buttons.push(...pageAccountButtons.map(button => ([button])));
            buttons.push([BUTTON.CREATE_NEW]);
            const paginationControl: InlineKeyboardButton[] = [];
            paginationControl.push(BUTTON.PAGINATION_BACK);
            paginationControl.push(BUTTON.PAGINATION_CLOSE);
            paginationControl.push(BUTTON.PAGINATION_NEXT);
            buttons.push(paginationControl);
        }
        const currentPage = Math.ceil((sceneOptions.offset + pageLimit) / pageLimit);
        const maxPage = Math.ceil(accounts.count / pageLimit);
        const messageContent: [string, Markup.Markup<InlineKeyboardMarkup>] = [
            `Page ${currentPage}/${maxPage}`, 
            Markup.inlineKeyboard(buttons),
        ];
        if (ctx.textQuery !== undefined && sceneOptions.count !== undefined) {
            await ctx.editMessageText(...messageContent).catch();
        } else {
            await ctx.reply(...messageContent).catch();
        }
        if (accounts.count > 0) {
            sceneOptions.count = accounts.count;
        }
    }),
);
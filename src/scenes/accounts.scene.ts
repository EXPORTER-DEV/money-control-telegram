import { Markup } from "telegraf";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { AccountModel } from "../database/models/account.model";
import { PaginationType } from "../database/models/interfaces";
import { AccountCurrency, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import { calculatePageIndex } from "../utils/calculatePageIndex";
import { CONSTANTS } from "./constants";

const pageLimit = CONSTANTS.PAGE_ACCOUNTS_LIMIT;

export const AccountsScene = new Scene(
    {
        name: SCENE_QUERY.accounts,
        startQuery: [SCENE_QUERY.accounts, '/accounts'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
    }),
    Scene.callback(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.pagination_close) {
            await ctx.scene.join(SCENE_QUERY.home);
            return false;
        }
    }),
    Scene.default(async (ctx) => {
        const accountModel = ctx.database.inject<AccountModel>(AccountModel);
        ctx.session.scene.options = ctx.session.scene.options || {};
        const sceneOptions: {offset: number, limit: number, count: number} = ctx.session.scene.options;

        if (ctx.session.scene.flags?.created) {
            ctx.session.scene.flags!.created = undefined;
            sceneOptions.count += 1;
            sceneOptions.offset = calculatePageIndex((sceneOptions.count || 0), pageLimit);
        }

        if (ctx.session.scene.flags?.deleted) {
            ctx.session.scene.flags!.deleted = undefined;
            sceneOptions.count -= 1;
        }

        const offset = sceneOptions.offset;
        const count = sceneOptions.count;

        let currentPage = Math.ceil((sceneOptions.offset + pageLimit) / pageLimit);
        let maxPage = Math.ceil(count / pageLimit);
        if (count !== undefined && offset !== undefined && currentPage > maxPage) {
            sceneOptions.offset = Math.floor((count - pageLimit) / pageLimit) * pageLimit;
            if (sceneOptions.offset < 0) {
                sceneOptions.offset = 0;
            }
        }

        ctx.session.sorting = ctx.session.sorting || {};
        ctx.session.sorting.account_amount_desc = ctx.session.sorting.account_amount_desc || true;

        if (ctx.textQuery !== undefined) {
            if (ctx.textQuery === BUTTON_QUERY.pagination_back && offset !== undefined && count !== undefined) {
                if (offset - pageLimit >= 0) {
                    sceneOptions.offset -= pageLimit;
                } else {
                    await ctx.answerCbQuery('No previous pages.').catch();
                    return;
                }
            }
            if (ctx.textQuery === BUTTON_QUERY.pagination_next && offset !== undefined && count !== undefined) {
                if (offset + pageLimit < count) {
                    sceneOptions.offset += pageLimit;
                } else {
                    await ctx.answerCbQuery('No next pages.').catch();
                    return;
                }
            }
            if (ctx.textQuery.indexOf('/account') === 0) {
                const id = ctx.textQuery.split(/\s/)[1];
                if (id !== undefined) {
                    ctx.textQuery = undefined;
                    await ctx.scene.join(SCENE_QUERY.manage_account, {param: {id}});
                }
                return;
            }
            if (ctx.textQuery === BUTTON_QUERY.create_new) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.create_account);
                return;
            }
            if (ctx.textQuery === BUTTON_QUERY.sort_amount_desc) {
                ctx.session.sorting.account_amount_desc = false;
            } else if (ctx.textQuery === BUTTON_QUERY.sort_amount_asc) {
                ctx.session.sorting.account_amount_desc = true;
            }
        }
        if (sceneOptions.offset === undefined) {
            sceneOptions.offset = 0;
        }
        const sorting_amount_desc = ctx.session.sorting.account_amount_desc;
        const sort: PaginationType[] = [{transactionsTotal: sorting_amount_desc ? -1 : 1}];
        const accounts = await accountModel.findAllByUserId(ctx.user._id, {
            offset: sceneOptions.offset, 
            limit: pageLimit,
            sort,
        });

        const buttons: InlineKeyboardButton[][] = [];
        const pageAccountButtons = accounts.items
            .map(account => 
                Markup.button.callback(
                    `${AccountType[account.type]} ${account.name} | ${account.transactionsTotal} ${account.type === AccountTypeEnum.PURPOSE && account.purpose ? `/ ${account.purpose} (${Math.round((account.transactionsTotal/account.purpose)*100)}%)` : ``} ${AccountCurrency[account.currency]}`, 
                    `/account ${account._id}`
                )
            );
        if (accounts.count === 0) {
            buttons.push([
                Markup.button.callback('No account found', 'empty')
            ]);
            buttons.push(
                [BUTTON.CREATE_NEW],
                [BUTTON.PAGINATION_CLOSE]
            );
        } else {
            ctx.session.sorting_account_desc = ctx.session.sorting_account_desc || true;
            buttons.push([sorting_amount_desc ? BUTTON.SORT_AMOUNT_DESC : BUTTON.SORT_AMOUNT_ASC]);
            buttons.push(...pageAccountButtons.map(button => ([button])));
            buttons.push([BUTTON.CREATE_NEW]);
            const paginationControl: InlineKeyboardButton[] = [];
            paginationControl.push(BUTTON.PAGINATION_BACK);
            paginationControl.push(BUTTON.PAGINATION_CLOSE);
            paginationControl.push(BUTTON.PAGINATION_NEXT);
            buttons.push(paginationControl);
        }
        currentPage = Math.ceil((sceneOptions.offset + pageLimit) / pageLimit);
        maxPage = Math.ceil(accounts.count / pageLimit);
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
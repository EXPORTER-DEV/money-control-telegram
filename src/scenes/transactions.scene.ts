import moment from "moment";
import { Markup } from "telegraf";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { TransactionModel } from "../database/models/transaction.model";
import { AccountCurrency, IAccountSchema } from "../database/schemas/account.schema";
import { IContext } from "../lib/bot.interface";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import { formatAmount } from "../utils/formatAmount";
import { CONSTANTS } from "./constants";

const pageLimit = CONSTANTS.PAGE_ACCOUNTS_LIMIT;

const exit = async (ctx: IContext) => {
    const back = await ctx.scene.history.back();
    if (!back) {
        await ctx.scene.join(SCENE_QUERY.home);
    }
};

export const TransactionsScene = new Scene(
    {
        name: SCENE_QUERY.transactions,
        startQuery: [SCENE_QUERY.transactions, '/transactions'],
    },
    Scene.joined(async (ctx) => {
        if (ctx.session.scene.account !== undefined) {
            await ctx.scene.jump(0, true);
        } else {
            await ctx.reply(`❗️ Can't find account.`);
            return exit(ctx);
        }
    }),
    Scene.callback(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.pagination_close) {
            await exit(ctx);
            return false;
        }
    }),
    Scene.default(async (ctx) => {
        const account = ctx.session.scene.account as IAccountSchema;
        const transactionModel = ctx.database.inject<TransactionModel>(TransactionModel);
        ctx.session.scene.options = ctx.session.scene.options || {};
        const sceneOptions: {offset: number, limit: number, count: number} = ctx.session.scene.options;

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
        }
        if (ctx.textQuery !== undefined) {
            //
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
            if (ctx.textQuery.indexOf('/transaction') === 0) {
                const id = ctx.textQuery.split(/\s/)[1];
                if (id !== undefined) {
                    ctx.textQuery = undefined;
                    await ctx.scene.join(SCENE_QUERY.manage_transaction, {param: {id}, account: ctx.session.scene.account});
                }
                return;
            }
            if (ctx.textQuery === BUTTON_QUERY.create_new) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.create_transaction);
                return;
            }
        }
        if (sceneOptions.offset === undefined) {
            sceneOptions.offset = 0;
        }
        const transactions = await transactionModel.findAllByAccountId(ctx.session.scene.account._id, ctx.user._id, {
            offset: sceneOptions.offset, 
            limit: pageLimit,
            sort: [
                {createdAt: -1},
            ]
        });

        const buttons: InlineKeyboardButton[][] = [];
        const pageTransactionButtons = transactions.items
            .map(transaction => {
                const createdAt = moment(transaction.createdAt).format('YYYY-MM-DD hh:mm:ss');
                return Markup.button.callback(
                    `${formatAmount(transaction.amount)} ${AccountCurrency[account.currency]} (${createdAt})`, 
                    `/transaction ${transaction._id}`
                );
            });
        if (transactions.count === 0) {
            buttons.push([
                Markup.button.callback('No transactions found', 'empty')
            ]);
            buttons.push(
                [BUTTON.CREATE_NEW],
                [BUTTON.PAGINATION_CLOSE]
            );
        } else {
            buttons.push(...pageTransactionButtons.map(button => ([button])));
            buttons.push([BUTTON.CREATE_NEW]);
            const paginationControl: InlineKeyboardButton[] = [];
            paginationControl.push(BUTTON.PAGINATION_BACK);
            paginationControl.push(BUTTON.PAGINATION_CLOSE);
            paginationControl.push(BUTTON.PAGINATION_NEXT);
            buttons.push(paginationControl);
        }
        currentPage = Math.ceil((sceneOptions.offset + pageLimit) / pageLimit);
        maxPage = Math.ceil(transactions.count / pageLimit);
        const messageContent: [string, Markup.Markup<InlineKeyboardMarkup>] = [
            `Page ${currentPage}/${maxPage}`, 
            Markup.inlineKeyboard(buttons),
        ];
        if (ctx.textQuery !== undefined && sceneOptions.count !== undefined) {
            await ctx.editMessageText(...messageContent).catch();
        } else {
            await ctx.reply(...messageContent).catch();
        }
        if (transactions.count > 0) {
            sceneOptions.count = transactions.count;
        }
    }),
);
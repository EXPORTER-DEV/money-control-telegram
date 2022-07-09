import { Markup } from "telegraf";
import { AccountCurrency, AccountDto } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { TransactionDto } from "../database/schemas/transaction.schema";
import moment from "moment";
import { formatAmount } from "../utils/formatAmount";
import { TransactionModel } from "../database/models/transaction.model";
import { escapeMarkdownV2 } from "../utils/escapeMarkdownV2";

const logger = loggerLib.child({
    module: SCENE_QUERY.delete_transaction,
    isScene: true
});

const exit = async (ctx: IContext, deleted: boolean = false) => {
    const back = await ctx.scene.history.back(deleted ? 2 : 1, {flags: {deleted: deleted ? true : undefined}});
    if (!back) {
        await ctx.scene.join(SCENE_QUERY.home);
    }
};

export const DeleteTransactionScene = new Scene(
    {
        name: SCENE_QUERY.delete_transaction,
        startQuery: [SCENE_QUERY.delete_transaction, '/delete-transaction'],
    },
    Scene.joined(async (ctx) => {
        if (ctx.session.scene.transaction !== undefined && ctx.session.scene.account !== undefined) {
            await ctx.scene.jump(0, true);
        } else {
            await ctx.reply(`❗️ Can't find transaction.`);
            return exit(ctx);
        }
    }),
    Scene.callback(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.pagination_close) {
            await exit(ctx);
            return false;
        }
        if (ctx.textQuery === BUTTON_QUERY.pagination_back) {
            ctx.session.scene.action = 'back';
            await ctx.scene.next(-1, true);
            return false;
        }
    }),
    Scene.default(async (ctx) => {
        const transaction: TransactionDto = ctx.session.scene.transaction;
        const account: AccountDto = ctx.session.scene.account;
        const createdAt = moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss');
        await ctx.replyWithMarkdownV2([
            `Are you sure, you would like to delete transaction: «${formatAmount(transaction.amount)} *${AccountCurrency[account.currency]}* (${createdAt})»?`,
            `⚠️ *Transaction will be permanently deleted*`
        ].map(message => escapeMarkdownV2(message)).join("\n"), Markup.inlineKeyboard([
            [BUTTON.CONFIRM],
            [BUTTON.PAGINATION_CLOSE]
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.confirm) {
            const transactionOptions = ctx.session.scene.transaction as TransactionDto;
            const account = ctx.session.scene.account as AccountDto;
            const createdAt = moment(transactionOptions.createdAt).format('YYYY-MM-DD HH:mm:ss');
            logger.info({userId: ctx.user.id, transactionOptions}, `Starting deleting transaction: ${transactionOptions._id!}`);
            const transactionModel = ctx.database.inject<TransactionModel>(TransactionModel);
            const result = await transactionModel.delete(transactionOptions._id);
            if (result) {
                await ctx.reply(`✅ Successfully deleted transaction «${formatAmount(transactionOptions.amount)} *${AccountCurrency[account.currency]}* (${createdAt})» for account: «${account.name}»`);
                logger.info({userId: ctx.user.id, transactionOptions}, `Deleted transaction: ${transactionOptions._id!}`);
                return exit(ctx, true);
            } else {
                await ctx.reply(`❌ Failed delete account: «${formatAmount(transactionOptions.amount)} *${AccountCurrency[account.currency]}* (${createdAt})» for account: «${account.name}»`);
                logger.warn({userId: ctx.user.id, transactionOptions}, `Failed delete account: ${transactionOptions._id!}`);
                return exit(ctx);
            }
        }
        
        return ctx.scene.next(-1, true);
    }),
);
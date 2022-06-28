import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountCurrencyEnum, AccountDto, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { CONSTANTS } from "./constants";
import { TransactionModel } from "../database/models/transaction.model";

const logger = loggerLib.child({
    module: SCENE_QUERY.create_transaction,
    isScene: true
});

const exit = async (ctx: IContext, created: boolean = false) => {
    if (ctx.session.scene?.referer === undefined) {
        await ctx.scene.join(SCENE_QUERY.home);
    } else {
        const options = ctx.session.scene.options;
        if (created && options) {
            options.options.offset = Math.floor((options.options.count + 1) / CONSTANTS.PAGE_ACCOUNTS_LIMIT) * CONSTANTS.PAGE_ACCOUNTS_LIMIT;
            ctx.textQuery = undefined;
        }
        await ctx.scene.join(ctx.session.scene.referer, options ?? {});
    }
};

export const CreateTransactionScene = new Scene(
    {
        name: SCENE_QUERY.create_transaction,
        startQuery: [SCENE_QUERY.create_transaction, '/create-transaction'],
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
        if (ctx.textQuery === BUTTON_QUERY.pagination_back) {
            ctx.session.scene.action = 'back';
            await ctx.scene.next(-1, true);
            return false;
        }
    }),
    Scene.default(async (ctx) => {
        const account: AccountDto = ctx.session.scene.account;
        await ctx.replyWithMarkdown(`Please enter the amount of the new transaction in *${AccountCurrency[account.currency]} ${account.currency.toUpperCase()}*`, Markup.inlineKeyboard([
            BUTTON.PAGINATION_CLOSE
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.session.scene.action !== 'back') {
            if (!ctx.message || !("text" in ctx.message)) return ctx.scene.next(-1, true);
            if (ctx.message.text.replace(/\s/gi, '').length === 0) return ctx.scene.next(-1, true);
            if (ctx.message.text.match(/^[-]*[1-9][0-9]*(\.[0-9]+)*$/gm) === null) return ctx.scene.next(-1, true);
            ctx.session.scene.transaction = {
                amount: parseFloat(ctx.message.text).toFixed(2),
            };
        } else {
            ctx.session.scene.action = undefined;
            return ctx.scene.next(-1, true);
        }
        return ctx.scene.next(1, true);
    }),
    Scene.default(async (ctx) => {
        const account: AccountDto = ctx.session.scene.account;
        const transactionOptions: {
            amount: number;
        } = ctx.session.scene.transaction;
        if (ctx.textQuery && ctx.textQuery === BUTTON_QUERY.save) {
            logger.info({userId: ctx.user.id, transactionOptions}, `Starting saving new transaction`);
            const transactionModel = ctx.database.inject<TransactionModel>(TransactionModel);
            const transaction = await transactionModel.create({
                ...transactionOptions,
                account: account._id,
                user: ctx.user._id
            }).catch((e) => {
                logger.error({userId: ctx.user.id, error: e.stack}, `Failed save new transaction`);
                return false;
            });
            if (transaction) {
                await ctx.reply(`✅ Successfully created new transaction`);
            } else {
                await ctx.reply(`❌ Failed create new transaction`);
            }
            return exit(ctx, true);
        }
        await ctx.replyWithMarkdown(
            [
                `Please confirm your transaction:`,
                `${transactionOptions.amount} *${AccountCurrency[account.currency]}* for account «*${account.name}*»`,
            ].filter(text => text.length > 0).join("\n"), Markup.inlineKeyboard([
                [
                    BUTTON.SAVE
                ], 
                [
                    BUTTON.PAGINATION_BACK,
                    BUTTON.PAGINATION_CLOSE
                ]
            ])
        );
    })
);
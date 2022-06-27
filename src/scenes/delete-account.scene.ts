import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrencyEnum, AccountDto, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { Types } from "mongoose";

const logger = loggerLib.child({
    module: SCENE_QUERY.delete_account,
    isScene: true
});

const exit = async (ctx: IContext, deleted: boolean = false) => {
    if (ctx.session.scene?.referer === undefined) {
        await ctx.scene.join(SCENE_QUERY.home);
    } else {
        let referer = ctx.session.scene.referer;
        let options = ctx.session.scene.options;
        if (deleted && options.options) {
            options = options.options;
            referer = options.name;
            ctx.textQuery = undefined;
        }
        await ctx.scene.join(referer, options ?? {});
    }
};

export const DeleteAccountScene = new Scene(
    {
        name: SCENE_QUERY.delete_account,
        startQuery: [SCENE_QUERY.delete_account, '/delete-account'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
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
        await ctx.replyWithMarkdown([
            `Are you sure, you would like to delete account: «*${account.name}*»?`,
            `⚠️ *All linked transaction will be permanently deleted*`
        ].join("\n"), Markup.inlineKeyboard([
            [BUTTON.CONFIRM],
            [BUTTON.PAGINATION_CLOSE]
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.confirm) {
            const accountOptions: {
                _id: Types.ObjectId;
                type: AccountTypeEnum;
                currency: AccountCurrencyEnum;
                name: string;
                purpose?: number;
            } = ctx.session.scene.account;
            logger.info({userId: ctx.user.id, accountOptions}, `Starting deleting account: ${accountOptions._id!}`);
            const accountModel = ctx.database.inject<AccountModel>(AccountModel);
            const result = await accountModel.delete(accountOptions._id);
            if (result) {
                await ctx.reply(`✅ Successfully deleted account and its transactions: «${accountOptions.name}»`);
                logger.info({userId: ctx.user.id, accountOptions}, `Deleted account and its transactions: ${accountOptions._id!}`);
            } else {
                await ctx.reply(`❌ Failed delete account: «${accountOptions.name}»`);
                logger.warn({userId: ctx.user.id, accountOptions}, `Failed delete account: ${accountOptions._id!}`);
            }
            return exit(ctx, true);
        }
        
        return ctx.scene.next(-1, true);
    }),
);
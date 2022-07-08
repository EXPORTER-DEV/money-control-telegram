import { Markup } from "telegraf";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import { IContext } from "../lib/bot.interface";
import { TransactionModel } from "../database/models/transaction.model";

const exit = async (ctx: IContext) => {
    if (ctx.session.scene?.referer === undefined) {
        await ctx.scene.join(SCENE_QUERY.home);
    } else {
        await ctx.scene.join(ctx.session.scene.referer, ctx.session.scene.options ?? {});
    }
};

export const ManageTransactionScene = new Scene(
    {
        name: SCENE_QUERY.manage_transaction,
        startQuery: [SCENE_QUERY.manage_transaction, '/manage-transaction'],
    },
    Scene.joined(async (ctx) => {
        if (ctx.session.scene.param?.id) {
            const transactionModel = ctx.database.inject<TransactionModel>(TransactionModel);
            const transaction = await transactionModel.findOne(ctx.session.scene.param?.id, ctx.user._id);
            if (transaction !== undefined) {
                ctx.session.scene.transaction = transaction;
                return ctx.scene.jump(0, true);
            }
        }
        ctx.textQuery = undefined;
        await ctx.reply(`❗️ Can't find transaction.`);
        return exit(ctx);
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
        await ctx.replyWithMarkdown(`Please select action for transaction`, Markup.inlineKeyboard([
            [BUTTON.DELETE],
            [BUTTON.PAGINATION_CLOSE]
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery && [BUTTON_QUERY.edit].includes(ctx.textQuery)) {
            if (ctx.textQuery === BUTTON_QUERY.delete) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.delete_transaction, {referer: SCENE_QUERY.manage_account, options: ctx.session.scene, transaction: ctx.session.scene.transaction});
            }
        } else {
            await ctx.scene.next(-1, true);
        }
    }),
);
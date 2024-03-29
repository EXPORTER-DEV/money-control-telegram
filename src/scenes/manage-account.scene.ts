import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountDto, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import { IContext } from "../lib/bot.interface";
import { formatAmount } from "../utils/formatAmount";

const exit = async (ctx: IContext) => {
    const back = await ctx.scene.history.back();
    if (!back) {
        await ctx.scene.join(SCENE_QUERY.home);
    }
};

export const ManageAccountScene = new Scene(
    {
        name: SCENE_QUERY.manage_account,
        startQuery: [SCENE_QUERY.manage_account, '/manage-account'],
    },
    Scene.joined(async (ctx) => {
        if (ctx.session.scene.param?.id) {
            const accountModel = ctx.database.inject<AccountModel>(AccountModel);
            const account = await accountModel.findOne(ctx.session.scene.param?.id, ctx.user._id);
            if (account !== undefined) {
                ctx.session.scene.account = account;
                return ctx.scene.jump(0, true);
            }
        }
        ctx.textQuery = undefined;
        await ctx.reply(`❗️ Can't find account.`);
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
        const account: AccountDto = ctx.session.scene.account;
        await ctx.replyWithMarkdown(`Please select action for ${AccountType[account.type]} - *${account.name}* | ${formatAmount(account.transactionsTotal)} ${account.type === AccountTypeEnum.PURPOSE && account.purpose ? `/ ${account.purpose} *${AccountCurrency[account.currency]}* (${Math.round((account.transactionsTotal/account.purpose)*100)}%)` : `*${AccountCurrency[account.currency]}*`}`, Markup.inlineKeyboard([
            [BUTTON.SHOW_TRANSACTION],
            [BUTTON.ADD_TRANSACTION],
            [BUTTON.EDIT, BUTTON.DELETE],
            [BUTTON.PAGINATION_CLOSE]
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery && [BUTTON_QUERY.edit, BUTTON_QUERY.delete, BUTTON_QUERY.add_transaction, BUTTON_QUERY.show_transaction].includes(ctx.textQuery)) {
            if (ctx.textQuery === BUTTON_QUERY.edit) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.edit_account, {account: ctx.session.scene.account});
            }
            if (ctx.textQuery === BUTTON_QUERY.delete) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.delete_account, {account: ctx.session.scene.account});
            }
            if (ctx.textQuery === BUTTON_QUERY.add_transaction) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.create_transaction, {account: ctx.session.scene.account});
            }
            if (ctx.textQuery === BUTTON_QUERY.show_transaction) {
                ctx.textQuery = undefined;
                await ctx.scene.join(SCENE_QUERY.transactions, {account: ctx.session.scene.account});
            }
        } else {
            await ctx.scene.next(-1, true);
        }
    }),
);
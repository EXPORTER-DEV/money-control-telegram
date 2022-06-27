import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountCurrencyEnum, AccountDto, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { Types } from "mongoose";

const logger = loggerLib.child({
    module: SCENE_QUERY.edit_account,
    isScene: true
});

const exit = async (ctx: IContext) => {
    if (ctx.session.scene?.referer === undefined) {
        await ctx.scene.join(SCENE_QUERY.home);
    } else {
        const options = ctx.session.scene.options;
        await ctx.scene.join(ctx.session.scene.referer, options ?? {});
    }
};

export const EditAccountScene = new Scene(
    {
        name: SCENE_QUERY.edit_account,
        startQuery: [SCENE_QUERY.edit_account, '/edit-account'],
    },
    Scene.joined(async (ctx) => {
        ctx.session.scene.originalAccount = Object.assign({}, ctx.session.scene.account);
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
        await ctx.reply(`Please enter the new name of account: «${account.name}»`, Markup.inlineKeyboard([
            [BUTTON.SKIP],
            [BUTTON.PAGINATION_CLOSE]
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.skip) {
            ctx.textQuery = undefined;
            return ctx.scene.next(1, true);
        }
        if (ctx.session.scene.action !== 'back') {
            if (!ctx.message || !("text" in ctx.message)) return ctx.scene.next(-1, true);
            if (ctx.message.text.replace(/\s/gi, '').length === 0) return ctx.scene.next(-1, true);
            if (ctx.message.text.match(/^[0-9a-zA-Zа-яА-Я\s]+$/) === null) return ctx.scene.next(-1, true);
            ctx.session.scene.account.name = ctx.message.text;
        } else {
            ctx.session.scene.action = undefined;
            return ctx.scene.next(-1, true);
        }
        return ctx.scene.next(1, true);
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery === BUTTON_QUERY.skip) {
            ctx.textQuery = undefined;
            return ctx.scene.next(1, true);
        }
        if (ctx.textQuery 
            && [BUTTON_QUERY.account_accumulative_type, BUTTON_QUERY.account_purpose_type].includes(ctx.textQuery)) {
            ctx.session.scene.account.type = BUTTON_QUERY.account_accumulative_type === ctx.textQuery ? 
                AccountTypeEnum.ACCUMULATIVE : 
                AccountTypeEnum.PURPOSE;
            return ctx.scene.next(1, true);
        }
        await ctx.reply(`Please select the new type of «${ctx.message && "text" in ctx.message ? ctx.message.text : ctx.session.scene.account.name}» account`, Markup.inlineKeyboard([
            [
                BUTTON.ACCOUNT_ACCUMULATIVE_TYPE,
                BUTTON.ACCOUNT_PURPOSE_TYPE
            ], 
            [
                BUTTON.PAGINATION_BACK,
                BUTTON.SKIP,
                BUTTON.PAGINATION_CLOSE
            ]
        ]));
    }),
    Scene.default(async (ctx) => {
        if (ctx.session.scene.account.type === AccountTypeEnum.PURPOSE) {
            if (ctx.message && "text" in ctx.message) {
                if (ctx.message.text.match(/^[0-9]+$/) !== null) {
                    ctx.session.scene.account.purpose = parseInt(ctx.message.text);
                    return ctx.scene.next(1, true);
                }
            }
            const buttons: InlineKeyboardButton[] = [
                BUTTON.PAGINATION_BACK,
                ctx.session.scene.originalAccount.purpose !== undefined ? BUTTON.SKIP : false,
                BUTTON.PAGINATION_CLOSE
            ].reduce((carry, item) => {
                if (typeof item !== 'boolean') {
                    carry.push(item);
                }
                return carry;
            }, [] as InlineKeyboardButton[]);
            await ctx.reply(`Please enter the new target amount for new purpose account (without currency and spaces, just integer, ex: «10000»)`, Markup.inlineKeyboard(buttons));
        } else {
            if (ctx.session.scene.action === 'back') {
                ctx.session.scene.action = undefined;
                return ctx.scene.next(-1, true);
            }
            await ctx.scene.next(1, true);
        }
    }),
    Scene.default(async (ctx) => {
        const originalAccountOptions: {
            type: AccountTypeEnum;
            currency: AccountCurrencyEnum;
            name: string;
            purpose?: number;
        } = ctx.session.scene.originalAccount;

        const accountOptions: {
            _id: Types.ObjectId;
            type: AccountTypeEnum;
            currency: AccountCurrencyEnum;
            name: string;
            purpose?: number;
        } = ctx.session.scene.account;
        if (ctx.textQuery && ctx.textQuery === BUTTON_QUERY.save) {
            logger.info({userId: ctx.user.id, accountOptions, originalAccountOptions}, `Starting saving account: ${accountOptions._id!}`);
            const accountModel = ctx.database.inject<AccountModel>(AccountModel);
            const result = await accountModel.save({
                ...accountOptions
            });
            if (result) {
                await ctx.reply(`✅ Successfully saved account: «${accountOptions.name}»`);
                logger.info({userId: ctx.user.id, accountOptions, originalAccountOptions}, `Saved account: ${accountOptions._id!}`);
            } else {
                await ctx.reply(`❌ Failed save account: «${accountOptions.name}»`);
                logger.warn({userId: ctx.user.id, accountOptions, originalAccountOptions}, `Failed save account: ${accountOptions._id!}`);
            }
            return exit(ctx);
        }
        await ctx.replyWithMarkdown(
            [
                `Please confirm your updated account:`,
                `\\- Name: ${originalAccountOptions.name !== accountOptions.name ? `«~${originalAccountOptions.name}~» ➞` : ``}«*${accountOptions.name}*»`,
                `\\- Account type: ${originalAccountOptions.type !== accountOptions.type ? `«~${AccountType[originalAccountOptions.type]} ${originalAccountOptions.type}~» ➞` : ``} *${AccountType[accountOptions.type]} ${accountOptions.type}*`,
                `\\- Currency: *${AccountCurrency[accountOptions.currency]}*`,
                `${accountOptions.type === AccountTypeEnum.PURPOSE ? `\\- Target amount: ${originalAccountOptions.type === accountOptions.type && originalAccountOptions.purpose !== accountOptions.purpose ? `«~${originalAccountOptions.purpose} ${AccountCurrency[originalAccountOptions.currency]}~» ➞` : ``}*${accountOptions.purpose} ${AccountCurrency[accountOptions.currency]}*`: ``}`
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
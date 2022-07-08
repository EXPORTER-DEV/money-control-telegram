import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountCurrencyEnum, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { CONSTANTS } from "./constants";
import { formatAmount } from "../utils/formatAmount";

const logger = loggerLib.child({
    module: SCENE_QUERY.create_account,
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

export const CreateAccountScene = new Scene(
    {
        name: SCENE_QUERY.create_account,
        startQuery: [SCENE_QUERY.create_account, '/create-account'],
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
        await ctx.reply('Please enter the name of new account', Markup.inlineKeyboard([
            BUTTON.PAGINATION_CLOSE
        ]));
        await ctx.scene.next(1);
    }),
    Scene.default(async (ctx) => {
        if (ctx.session.scene.action !== 'back') {
            if (!ctx.message || !("text" in ctx.message)) return ctx.scene.next(-1, true);
            if (ctx.message.text.replace(/\s/gi, '').length === 0) return ctx.scene.next(-1, true);
            if (ctx.message.text.match(/^[0-9a-zA-Zа-яА-Я\s]+$/) === null) return ctx.scene.next(-1, true);
            ctx.session.scene.account = {
                name: ctx.message.text
            };
        } else {
            ctx.session.scene.action = undefined;
            return ctx.scene.next(-1, true);
        }
        return ctx.scene.next(1, true);
    }),
    Scene.default(async (ctx) => {
        if (ctx.session.scene.account?.name 
            && ctx.textQuery 
            && [BUTTON_QUERY.account_accumulative_type, BUTTON_QUERY.account_purpose_type].includes(ctx.textQuery)) {
            ctx.session.scene.account.type = BUTTON_QUERY.account_accumulative_type === ctx.textQuery ? 
                AccountTypeEnum.ACCUMULATIVE : 
                AccountTypeEnum.PURPOSE;
            return ctx.scene.next(1, true);
        }
        await ctx.reply(`Please select type of new «${ctx.message && "text" in ctx.message ? ctx.message.text : ctx.session.scene.account.name}» account`, Markup.inlineKeyboard([
            [
                BUTTON.ACCOUNT_ACCUMULATIVE_TYPE,
                BUTTON.ACCOUNT_PURPOSE_TYPE
            ], 
            [
                BUTTON.PAGINATION_BACK,
                BUTTON.PAGINATION_CLOSE
            ]
        ]));
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery 
            && [BUTTON_QUERY.account_rub_currency, BUTTON_QUERY.account_usd_currency].includes(ctx.textQuery)) {
            ctx.session.scene.account.currency = BUTTON_QUERY.account_rub_currency === ctx.textQuery ?
                AccountCurrencyEnum.RUB :
                AccountCurrencyEnum.USD;
            return ctx.scene.next(1, true);
        }
        await ctx.reply(`Please select currency for new ${ctx.session.scene.account.type === AccountTypeEnum.PURPOSE ? 'purpose' : 'accumulative'} account`, Markup.inlineKeyboard([
            [
                BUTTON.ACCOUNT_RUB_CURRENCY,
                BUTTON.ACCOUNT_USD_CURRENCY
            ],
            [
                BUTTON.PAGINATION_BACK,
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
            await ctx.reply(`Please enter the target amount for new purpose account (without currency and spaces, just integer, ex: «10000»)`, Markup.inlineKeyboard([
                [
                    BUTTON.PAGINATION_BACK,
                    BUTTON.PAGINATION_CLOSE
                ]
            ]));
        } else {
            if (ctx.session.scene.action === 'back') {
                ctx.session.scene.action = undefined;
                return ctx.scene.next(-1, true);
            }
            await ctx.scene.next(1, true);
        }
    }),
    Scene.default(async (ctx) => {
        const accountOptions: {
            type: AccountTypeEnum;
            currency: AccountCurrencyEnum;
            name: string;
            purpose?: number;
        } = ctx.session.scene.account;
        if (ctx.textQuery && ctx.textQuery === BUTTON_QUERY.save) {
            logger.info({userId: ctx.user.id, accountOptions}, `Starting saving new account`);
            const accountModel = ctx.database.inject<AccountModel>(AccountModel);
            const account = await accountModel.create({
                ...accountOptions,
                user: ctx.user._id
            }).catch((e) => {
                logger.error({userId: ctx.user.id, error: e.stack}, `Failed save new account`);
                return false;
            });
            if (account) {
                await ctx.reply(`✅ Successfully created new account: «${accountOptions.name}»`);
            } else {
                await ctx.reply(`❌ Failed create new account: «${accountOptions.name}»`);
            }
            return exit(ctx, true);
        }
        await ctx.replyWithMarkdown(
            [
                `Please confirm your new account:`,
                `\\- Name: «*${accountOptions.name}*»`,
                `\\- Account type: *${AccountType[accountOptions.type]} ${accountOptions.type}*`,
                `\\- Currency: *${AccountCurrency[accountOptions.currency]}*`,
                `${accountOptions.type === AccountTypeEnum.PURPOSE 
                    ? `\\- Target amount: *${formatAmount(accountOptions.purpose!)} ${AccountCurrency[accountOptions.currency]}*`
                    : ``}`
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
import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountCurrencyEnum, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { BUTTON_QUERY } from "../navigation/button-query";
import { SCENE_QUERY } from "../navigation/scene-query";
import loggerLib from '../lib/logger/logger';
import { IContext } from "../lib/bot.interface";
import { formatAmount } from "../utils/formatAmount";
import { escapeMarkdownV2 } from "../utils/escapeMarkdownV2";

const logger = loggerLib.child({
    module: SCENE_QUERY.create_account,
    isScene: true
});

const exit = async (ctx: IContext, created: boolean = false) => {
    const back = await ctx.scene.history.back(1, {flags: {created: created ? true : undefined}});
    if (!back) {
        await ctx.scene.join(SCENE_QUERY.home);
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
            && [BUTTON_QUERY.account_rub_currency, BUTTON_QUERY.account_usd_currency, BUTTON_QUERY.account_eur_currency].includes(ctx.textQuery)) {
            switch (ctx.textQuery) {
                case BUTTON_QUERY.account_rub_currency:
                    ctx.session.scene.account.currency = AccountCurrencyEnum.RUB;
                    break;
                case BUTTON_QUERY.account_eur_currency:
                    ctx.session.scene.account.currency = AccountCurrencyEnum.EUR;
                    break;
                default:
                    ctx.session.scene.account.currency = AccountCurrencyEnum.USD;
            }

            return ctx.scene.next(1, true);
        }
        await ctx.reply(`Please select currency for new ${ctx.session.scene.account.type === AccountTypeEnum.PURPOSE ? 'purpose' : 'accumulative'} account`, Markup.inlineKeyboard([
            [
                BUTTON.ACCOUNT_RUB_CURRENCY,
                BUTTON.ACCOUNT_USD_CURRENCY,
                BUTTON.ACCOUNT_EUR_CURRENCY,
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
                if (ctx.message.text.match(/^[-]*[1-9][0-9]*(\.[0-9]+)*$/gm) !== null) {
                    ctx.session.scene.account.purpose = parseFloat(ctx.message.text).toFixed(2);
                    return ctx.scene.next(1, true);
                }
            }
            await ctx.reply(`Please enter the target amount for new purpose account (just integers only format)`, Markup.inlineKeyboard([
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
                return exit(ctx, true);
            } else {
                await ctx.reply(`❌ Failed create new account: «${accountOptions.name}»`);
                return exit(ctx);
            }
        }
        await ctx.replyWithMarkdownV2(
            [
                `Please confirm your new account:`,
                `- Name: «*${accountOptions.name}*»`,
                `- Account type: *${AccountType[accountOptions.type]} ${accountOptions.type}*`,
                `- Currency: *${AccountCurrency[accountOptions.currency]}*`,
                `${accountOptions.type === AccountTypeEnum.PURPOSE 
                    ? `- Target amount: *${formatAmount(accountOptions.purpose!)} ${AccountCurrency[accountOptions.currency]}*`
                    : ``}`
            ].map(message => escapeMarkdownV2(message)).filter(text => text.length > 0).join("\n"), Markup.inlineKeyboard([
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
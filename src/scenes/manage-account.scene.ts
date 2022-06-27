import { Markup } from "telegraf";
import { AccountModel } from "../database/models/account.model";
import { AccountCurrency, AccountType } from "../database/schemas/account.schema";
import { Scene } from "../middlewares/scene/scene";
import { BUTTON } from "../navigation/button";
import { SCENE_QUERY } from "../navigation/scene-query";

export const ManageAccountScene = new Scene(
    {
        name: SCENE_QUERY.manage_account,
        startQuery: [SCENE_QUERY.manage_account, '/manage-account'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
    }),
    Scene.callback(async (ctx) => {
        if(ctx.textQuery === SCENE_QUERY.pagination_close){
            if(ctx.session.scene?.referer === undefined){
                await ctx.scene.join(SCENE_QUERY.home);
            }else{
                await ctx.scene.join(ctx.session.scene.referer);
            }
            return false;
        }
        if(ctx.textQuery === SCENE_QUERY.pagination_back){
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
        if(ctx.session.scene.account?.name && ctx.textQuery && [SCENE_QUERY.account_accumulative_type, SCENE_QUERY.account_purpose_type].includes(ctx.textQuery)){
            ctx.session.scene.account.type = SCENE_QUERY.account_accumulative_type === ctx.textQuery ? 
                SCENE_QUERY.account_accumulative_type : 
                SCENE_QUERY.account_purpose_type;
            return ctx.scene.next(1, true);
        }
        if(!ctx.message || !("text" in ctx.message)) return ctx.scene.next(-1, true);
        if(ctx.message.text.replace(/\s/gi, '').length === 0) return ctx.scene.next(-1, true);
        ctx.session.scene.account = {
            name: ctx.message.text
        };
        await ctx.reply(`Please select type of new «${ctx.message.text}» account`, Markup.inlineKeyboard([
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
        await ctx.reply('Here we are', Markup.inlineKeyboard([
            [
                BUTTON.ACCOUNT_ACCUMULATIVE_TYPE,
                BUTTON.ACCOUNT_PURPOSE_TYPE
            ], 
            [
                BUTTON.PAGINATION_BACK,
                BUTTON.PAGINATION_CLOSE
            ]
        ]));
    })
);
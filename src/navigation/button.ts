import { Markup } from "telegraf";
import { AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { SCENE_QUERY } from "./scene-query";

export const BUTTON = {
    'TEST_SCENE': Markup.button.callback('Scene 🔥', SCENE_QUERY.test),
    'ABOUT_BOT': Markup.button.callback('About me!', SCENE_QUERY.about),
    'HOME': Markup.button.callback('🔙 Home', SCENE_QUERY.home),
    'ACCOUNTS': Markup.button.callback('💰 Accounts', SCENE_QUERY.accounts),
    'PAGINATION_NEXT': Markup.button.callback('➡️', SCENE_QUERY.pagination_next),
    'PAGINATION_CLOSE': Markup.button.callback('❌', SCENE_QUERY.pagination_close),
    'PAGINATION_BACK': Markup.button.callback('⬅️', SCENE_QUERY.pagination_back),
    'CREATE_NEW': Markup.button.callback('➕ Create', SCENE_QUERY.create_new),
    'ACCOUNT_ACCUMULATIVE_TYPE': Markup.button.callback(`${AccountType.accumulative} Accumulative`, SCENE_QUERY.account_accumulative_type),
    'ACCOUNT_PURPOSE_TYPE': Markup.button.callback(`${AccountType.purpose} Purpose`, SCENE_QUERY.account_purpose_type)
};
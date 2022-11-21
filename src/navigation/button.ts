import { Markup } from "telegraf";
import { AccountCurrency, AccountType, AccountTypeEnum } from "../database/schemas/account.schema";
import { BUTTON_QUERY } from "./button-query";
import { SCENE_QUERY } from "./scene-query";

export const BUTTON = {
    'TEST_SCENE': Markup.button.callback('Scene 🔥', SCENE_QUERY.test),
    'ABOUT_BOT': Markup.button.callback('About me!', SCENE_QUERY.about),
    'HOME': Markup.button.callback('🔙 Home', SCENE_QUERY.home),
    'ACCOUNTS': Markup.button.callback('💰 Accounts', SCENE_QUERY.accounts),
    'PAGINATION_NEXT': Markup.button.callback('➡️', BUTTON_QUERY.pagination_next),
    'PAGINATION_CLOSE': Markup.button.callback('❌', BUTTON_QUERY.pagination_close),
    'PAGINATION_BACK': Markup.button.callback('⬅️', BUTTON_QUERY.pagination_back),
    'CREATE_NEW': Markup.button.callback('➕ Create', BUTTON_QUERY.create_new),
    'ACCOUNT_ACCUMULATIVE_TYPE': Markup.button.callback(`${AccountType.accumulative} Accumulative`, BUTTON_QUERY.account_accumulative_type),
    'ACCOUNT_PURPOSE_TYPE': Markup.button.callback(`${AccountType.purpose} Purpose`, BUTTON_QUERY.account_purpose_type),
    'ACCOUNT_USD_CURRENCY': Markup.button.callback(`USD: ${AccountCurrency.usd}`, BUTTON_QUERY.account_usd_currency),
    'ACCOUNT_RUB_CURRENCY': Markup.button.callback(`RUB: ${AccountCurrency.rub}`, BUTTON_QUERY.account_rub_currency),
    'ACCOUNT_EUR_CURRENCY': Markup.button.callback(`EUR: ${AccountCurrency.eur}`, BUTTON_QUERY.account_eur_currency),
    'SAVE': Markup.button.callback(`💾 Save`, BUTTON_QUERY.save),
    'EDIT': Markup.button.callback('📝 Edit', BUTTON_QUERY.edit),
    'DELETE': Markup.button.callback('🗑 Delete', BUTTON_QUERY.delete),
    'SHOW_TRANSACTION': Markup.button.callback('📊 Open transactions', BUTTON_QUERY.show_transaction),
    'ADD_TRANSACTION': Markup.button.callback('🏧 Add transaction', BUTTON_QUERY.add_transaction),
    'SKIP': Markup.button.callback('🔘 Skip', BUTTON_QUERY.skip),
    'CONFIRM': Markup.button.callback('🆗 Confirm', BUTTON_QUERY.confirm),
    'FILTER': Markup.button.callback('⚙️ Filter', BUTTON_QUERY.filter),
    'SORT_AMOUNT_DESC': Markup.button.callback('Sort amount ⬇', BUTTON_QUERY.sort_amount_desc),
    'SORT_AMOUNT_ASC': Markup.button.callback('Sort amount ⬆', BUTTON_QUERY.sort_amount_asc),
    'SORT_TARGET_DESC': Markup.button.callback('Sort target % ⬇', BUTTON_QUERY.sort_amount_desc),
    'SORT_TARGET_ASC': Markup.button.callback('Sort target % ⬆', BUTTON_QUERY.sort_amount_asc),
    'SORT_DATE_DESC': Markup.button.callback('Sort date ⬇', BUTTON_QUERY.sort_date_desc),
    'SORT_DATE_ASC': Markup.button.callback('Sort date ⬆', BUTTON_QUERY.sort_date_asc),
    'FILTER_ACCOUNT_TYPE_PURPOSE': Markup.button.callback(`Purpose ${AccountType[AccountTypeEnum.PURPOSE]}`, BUTTON_QUERY.filter_account_type_purpose),
    'FILTER_ACCOUNT_TYPE_ACCUMULATIVE': Markup.button.callback(`Accumulative ${AccountType[AccountTypeEnum.ACCUMULATIVE]}`, BUTTON_QUERY.filter_account_type_accumulative),
    'FILTER_ACCOUNT_TYPE_ALL': Markup.button.callback('Show all', BUTTON_QUERY.filter_account_type_all),
};
import { Markup } from "telegraf";
import { BUTTON } from "./button";

export const KEYBOARD = {
    'MAIN': Markup.inlineKeyboard([
        [BUTTON.ABOUT_BOT],
        [BUTTON.HOME],
        [BUTTON.ACCOUNTS],
    ])
};
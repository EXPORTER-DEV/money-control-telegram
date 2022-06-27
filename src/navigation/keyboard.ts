import { Markup } from "telegraf";
import { BUTTON } from "./button";

export const KEYBOARD = {
    'MAIN': Markup.inlineKeyboard([
        BUTTON.TEST_SCENE,
        BUTTON.ABOUT_BOT,
        BUTTON.HOME,
    ])
}
import { Markup } from "telegraf";
import { SCENE_QUERY } from "./scene-query";

export const BUTTON = {
    'TEST_SCENE': Markup.button.callback('Scene 🔥', SCENE_QUERY.test),
    'ABOUT_BOT': Markup.button.callback('About me!', SCENE_QUERY.about),
    'HOME': Markup.button.callback('🔙 Home', SCENE_QUERY.home),
}
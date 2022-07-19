import { Scene } from "../middlewares/scene/scene";
import { KEYBOARD } from "../navigation/keyboard";
import { SCENE_QUERY } from "../navigation/scene-query";

export const HomeScene = new Scene(
    {
        name: SCENE_QUERY.home,
        startQuery: [SCENE_QUERY.home, '/start'],
    },
    Scene.joined(async (ctx) => {
        await ctx.scene.jump(0, true);
    }),
    Scene.default(async (ctx) => {
        ctx.scene.history.clear();
        await ctx.reply(`Main page of Finance Flow Bot 🤑`, KEYBOARD.MAIN);
        await ctx.scene.exit();
    }),
);
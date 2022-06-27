import { Scene } from "../middlewares/scene/scene";
import { SCENE_QUERY } from "../navigation/scene-query";

export const TestScene = new Scene(
    {
        name: SCENE_QUERY.test,
        startQuery: SCENE_QUERY.test,
    },
    Scene.joined(async (ctx) => {
        await ctx.reply('Hello!');
    }),
    Scene.exited(async (ctx) => {
        await ctx.reply('See you soon!');
    }),
    Scene.default(async (ctx) => {
        await ctx.reply('Test');
        await ctx.scene!.next();
    }),
)
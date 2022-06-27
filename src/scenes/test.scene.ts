import { Markup } from "telegraf";
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
        const accounts = [];
        for (let i = 0; i < 100; i++) {
            accounts.push(`Item ${i + 1}`);
        }
        await ctx.replyWithMarkdown('Test [yandex](https://yandex.ru/)');
        ctx.session.scene.updated = 1;
        await ctx.scene!.next();
    }),
    Scene.default(async (ctx) => {
        if (ctx.textQuery) {
            console.log(1);
            try {
                ctx.session.scene.updated += 1;
                await ctx.answerCbQuery('123');
                await ctx.editMessageText(`Counter: ${ctx.session.scene.updated}`, Markup.inlineKeyboard([
                    Markup.button.callback('Next', 'next'),
                ]));
            } catch (e) {
                console.log(e);
                ctx.reply('123');
            }
            // throw new Error('123');
        }
    }),
);
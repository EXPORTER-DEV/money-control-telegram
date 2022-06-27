import { Markup, Telegraf } from 'telegraf';
import 'dotenv/config';
import "reflect-metadata";
import { Session } from './middlewares/session/session';
import Configuration from './config';
import logger from './lib/logger/logger';
import { IContext } from './lib/bot.interface';

const config = Configuration();

logger.info(`Using config: ${JSON.stringify(config)}`);

const session = new Session({
    connection: config.redis,
}, logger);

const bot = new Telegraf<IContext>(process.env.BOT_TOKEN || '')

bot.use(session.init());

bot.command('quit', (ctx) => {
    // Explicit usage
    //   ctx.telegram.leaveChat(ctx.message.chat.id)

    // Using context shortcut
    ctx.leaveChat()
})

bot.on('text', async (ctx) => {
    // console.log(ctx);
    // Explicit usage
    //   ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

    // Using context shortcut
    ctx.session.counter = ctx.session.counter + 1 || 1;
    await ctx.reply(`Hello 1 ${ctx.session.counter}`, Markup
        .inlineKeyboard([
            Markup.button.callback('Test', 'callback_action'),
        ])
    )
})


bot.action('callback_action', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('test');
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
import { Markup, Telegraf } from 'telegraf';
import 'dotenv/config';
import "reflect-metadata";
import Session from './middlewares/session';
import Database from './middlewares/database';
import Configuration from './config';
import logger from './lib/logger/logger';
import { IContext } from './lib/bot.interface';
import mongoose, { Mongoose } from 'mongoose';
import { load } from './database';

const config = Configuration();

const bot = new Telegraf<IContext>(process.env.BOT_TOKEN || '');

let session: Session;
let connection: Mongoose;
let database: Database;

logger.info(`Using config: ${JSON.stringify(config)}`);

const init = async () => {
    try {
        logger.info({
            module: 'Session'
        }, `Initing`);
        session = new Session({
            connection: config.redis,
        }, logger);
        bot.use(session.init());
        logger.info({
            module: 'Session'
        }, `Successfully inited`);
    } catch(e: any) {
        logger.error({
            module: 'Session',
        }, `Failed initing: ${e.stack!}`);
    }
    const url = `mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}`;
    try {
        logger.info({
            module: 'MongoDB',
        }, `Starting connecting with: ${url}`);
        connection = await mongoose.connect(url);
        logger.info({
            module: 'MongoDB',
        }, `Successfully connected.`);
    } catch(e: any) {
        logger.error({
            module: 'MongoDB',
        }, `Failed connecting: ${e.stack!}`);
    }
    try {
        logger.info({
            module: 'Database',
        }, `Starting initing database models`);
        const models = await load(connection);
        database = new Database(models);
        bot.use(database.init());
        logger.info({
            module: 'Database',
        }, `Successfully inited database models`);
    } catch(e: any) {
        logger.error({
            module: 'Database',
        }, `Failed  initing: ${e.stack!}`);
    }

    //
    bot.command('quit', (ctx) => {
        // Explicit usage
        //   ctx.telegram.leaveChat(ctx.message.chat.id)
    
        // Using context shortcut
        ctx.leaveChat()
    })
    
    bot.on('text', async (ctx, next) => {
        ctx.session.counter = ctx.session.counter + 1 || 1;
        await ctx.reply(`Hello 1 ${ctx.session.counter}`, Markup
            .inlineKeyboard([
                Markup.button.callback('Test', 'callback_action'),
            ])
        )
        await next();
    });
    
    bot.on('callback_query', (async (ctx) => {
        console.log('CALLBACK_QUERY');
        console.dir(ctx.callbackQuery);
    }));
    
    
    bot.action('callback_action', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.editMessageText('test');
    });
    //

    bot.launch();
    
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
};

init();
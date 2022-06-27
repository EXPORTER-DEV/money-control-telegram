import { Markup, Telegraf } from 'telegraf';
import 'dotenv/config';
import "reflect-metadata";

import SessionMiddleware from './middlewares/session';
import DatabaseMiddleware from './middlewares/database';
import UserMiddleware from './middlewares/user';
import SceneMiddleware from './middlewares/scene';

import Configuration from './config';
import logger from './lib/logger/logger';
import { IContext } from './lib/bot.interface';
import mongoose, { Mongoose } from 'mongoose';
import { load } from './database';

import { TestScene } from './scenes/test.scene';

const config = Configuration();

const bot = new Telegraf<IContext>(process.env.BOT_TOKEN || '');

let session: SessionMiddleware;
let database: DatabaseMiddleware;

let connection: Mongoose;

logger.info(`Using config: ${JSON.stringify(config)}`);

const init = async () => {
    const sessionLogger = logger.child({
        module: 'SessionMiddleware'
    });
    try {
        sessionLogger.info(`Initing`);
        session = new SessionMiddleware({
            connection: config.redis,
        }, logger);
        bot.use(session.init());
        sessionLogger.info(`Successfully inited`);
    } catch(e: any) {
        sessionLogger.error(`Failed initing: ${e.stack!}`);
    }

    const url = `mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}`;
    const mongoLogger = logger.child({
        module: 'MongoDB',
    });
    try {
        mongoLogger.info(`Starting connecting with: ${url}`);
        connection = await mongoose.connect(url);
        mongoLogger.info(`Successfully connected.`);
    } catch(e: any) {
        mongoLogger.error(`Failed connecting: ${e.stack!}`);
    }

    const databaseLogger = logger.child({
        module: 'DatabaseMiddleware'
    });
    try {
        databaseLogger.info(`Starting initing database models`);
        const models = await load(connection);
        database = new DatabaseMiddleware(models);
        bot.use(database.init());
        databaseLogger.info(`Successfully inited database models`);
    } catch(e: any) {
        databaseLogger.error(`Failed initing: ${e.stack!}`);
    }

    const sceneLogger = logger.child({
        module: 'SceneMiddleware',
    })
    try {
        sceneLogger.info(`Initing`);
        const scene = new SceneMiddleware(logger, [
            TestScene
        ]);
        bot.use(scene.init());
        sceneLogger.info(`Successfully inited.`);
    } catch(e: any) {
        sceneLogger.error(`Failed initing: ${e.stack!}`);
    }

    const user = new UserMiddleware(logger);
    bot.use(user.init());
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
                Markup.button.callback('Scene', 'test_callback'),
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
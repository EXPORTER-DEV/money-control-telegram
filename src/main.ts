import { Markup, Telegraf } from 'telegraf';
import 'dotenv/config';
import "reflect-metadata";

import CatchErrorMiddleware from './middlewares/catch-error';
import SessionMiddleware from './middlewares/session';
import DatabaseMiddleware from './middlewares/database';
import UserMiddleware from './middlewares/user';
import SceneMiddleware from './middlewares/scene';
import TextQueryMiddleware from './middlewares/text-query';

import Configuration from './config';
import logger from './lib/logger/logger';
import { IContext } from './lib/bot.interface';
import mongoose, { Mongoose } from 'mongoose';
import { load } from './database';

import { SCENE_QUERY } from './navigation/scene-query';

import { TestScene } from './scenes/test.scene';
import { HomeScene } from './scenes/home.scene';
import { AccountsScene } from './scenes/accounts.scene';
import { ManageAccountScene } from './scenes/manage-account.scene';
const config = Configuration();

const bot = new Telegraf<IContext>(config.bot_token);

let session: SessionMiddleware;
let database: DatabaseMiddleware;

let connection: Mongoose;

logger.info(`Using config: ${JSON.stringify(config)}`);

const init = async () => {
    const catchError = new CatchErrorMiddleware(logger);
    bot.use(catchError.init());
    
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
    } catch (e: any) {
        sessionLogger.error(`Failed initing: ${e.stack!}`);
    }

    const url = `mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`;
    const mongoLogger = logger.child({
        module: 'MongoDB',
    });
    try {
        mongoLogger.info(`Starting connecting with: ${url}`);
        connection = await mongoose.connect(url);
        mongoLogger.info(`Successfully connected.`);
    } catch (e: any) {
        mongoLogger.error(`Failed connecting: ${e.stack!}`);
    }

    const databaseLogger = logger.child({
        module: 'DatabaseMiddleware'
    });
    try {
        databaseLogger.info(`Starting initing database models`);
        const models = await load(connection, logger);
        database = new DatabaseMiddleware(models);
        bot.use(database.init());
        databaseLogger.info(`Successfully inited database models`);
    } catch (e: any) {
        databaseLogger.error(`Failed initing: ${e.stack!}`);
    }
    
    const user = new UserMiddleware(logger);
    bot.use(user.init());
    bot.use(TextQueryMiddleware);

    const sceneLogger = logger.child({
        module: 'SceneMiddleware',
    });
    try {
        sceneLogger.info(`Initing`);
        const scene = new SceneMiddleware(logger, [
            TestScene,
            HomeScene,
            AccountsScene,
            ManageAccountScene
        ]);
        bot.use(scene.init());
        sceneLogger.info(`Successfully inited.`);
    } catch (e: any) {
        sceneLogger.error(`Failed initing: ${e.stack!}`);
    }
    //
    bot.command('quit', (ctx) => {
        // Explicit usage
        //   ctx.telegram.leaveChat(ctx.message.chat.id)
    
        // Using context shortcut
        ctx.leaveChat();
    });


    bot.command('/start', async (ctx, next) => {
        await ctx.scene.join(SCENE_QUERY.home);
        return next();
    });
    
    // bot.on('text', async (ctx, next) => {
    //     ctx.session.counter = ctx.session.counter + 1 || 1;
    //     await ctx.reply(`Hello! Counter is: ${ctx.session.counter}`, KEYBOARD.MAIN);
    //     return next();
    // });
    
    bot.on('callback_query', (async (ctx, next) => {
        console.log('CALLBACK_QUERY');
        console.dir(ctx.callbackQuery);
        return next();
    }));
    
    
    bot.action('callback_action', async (ctx, next) => {
        await ctx.answerCbQuery();
        await ctx.editMessageText('test');
        return next();
    });

    bot.command('account', async (ctx, next) => {
        console.dir(ctx.message);
        return next();
    });
    //

    bot.launch();
    
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

init();
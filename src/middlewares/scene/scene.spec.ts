import { ILogger } from '../../lib/logger/logger';
import { ContextProvider, LoggerProvider, SceneProvider, UseProvider } from '../../test/common';
import { IScene, ISceneInfo, SceneItemEnum } from './scene.interface';
import { SceneMiddleware } from './scene.middleware';

describe('src/middlewares/scene/scene.middleware.ts', () => {

    describe('Check basic', () => {
        let logger: ILogger;

        beforeEach(() => {
            logger = LoggerProvider();
        });

        it('Check scene register with duplicates, should throw error', () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
            ];

            expect(() => {new SceneMiddleware(logger, scenes);}).toThrowError();
        });

        it('Check scene register with scenes, should register success', () => {
            const infoMock = jest.fn();
            logger.child = jest.fn(() => ({
                info: infoMock,
            }) as any);

            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
            ];

            new SceneMiddleware(logger, scenes);

            expect(infoMock).toBeCalledTimes(scenes.length);
        });

    });

    describe('Check scene behaviour', () => {
        const logger: ILogger = LoggerProvider();

        it('Check scene join by callback query', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
            ];

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: scenes[0].data.startQuery as string,
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(0);
            expect(scenes[0].joined[0].handler).toBeCalledTimes(1);
            expect(scenes[0].items[0].handler).toBeCalledTimes(0);
        });

        it('Check scene join by callback query, when already inside scene', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
            ];

            let context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: scenes[0].data.startQuery as string,
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(0);
            expect(scenes[0].joined[0].handler).toBeCalledTimes(1);
            expect(scenes[0].items[0].handler).toBeCalledTimes(0);

            context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: scenes[1].data.startQuery as string,
                session: context.session,
            });

            await UseProvider(sceneMiddleware.init(), context as any, next);

            expect(next).toBeCalledTimes(0);
            expect(scenes[0].exited[0].handler).toBeCalledTimes(1);
            expect(scenes[1].joined[0].handler).toBeCalledTimes(1);
            expect(scenes[1].items[0].handler).toBeCalledTimes(0);
        });

        it('Check scene item callback behaviour', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
            ];

            let context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: scenes[0].data.startQuery as string,
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(0);
            expect(scenes[0].joined[0].handler).toBeCalledTimes(1);
            expect(scenes[0].items[0].handler).toBeCalledTimes(0);

            context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: 'some_query',
                session: context.session,
            });

            await UseProvider(sceneMiddleware.init(), context as any, next);

            expect(next).toBeCalledTimes(0);
            expect(scenes[0].callback[0].handler).toBeCalledTimes(1);
        });

        it('Check reset scene if it\'s not found', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
            ];

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: 'some_query',
                session: {
                    scene: {}
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(1);
            expect(context.session!.scene).toStrictEqual(undefined);
        });

        it('Check scene callback query join to another scene', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
            ];

            scenes[0].callback[0].handler = async (ctx) => {
                return ctx.scene.join(scenes[1].data.name);
            };

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: 'some_query',
                session: {
                    scene: {
                        name: scenes[0].data.name,
                        current: 0,
                    },
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(0);
            expect(scenes[0].items[0].handler).toBeCalledTimes(0);
            expect(scenes[1].joined[0].handler).toBeCalledTimes(1);
        });

        it('Check scene callback query stop handling default scene item', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
            ];

            scenes[0].callback[0].handler = jest.fn(async () => {
                return false;
            });

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                textQuery: 'some_query',
                session: {
                    scene: {
                        name: scenes[0].data.name,
                        current: 0,
                    },
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);
            
            expect(next).toBeCalledTimes(0);
            expect(scenes[0].callback[0].handler).toBeCalledTimes(1);
            expect(scenes[0].items[0].handler).toBeCalledTimes(0);
        });
    });

    describe('Check scene item controller behaviour', () => {
        const logger: ILogger = LoggerProvider();

        it('Check next & jump', async () => {
            const scene = SceneProvider({
                name: 'test',
                startQuery: 'test_query',
            });

            scene.items = [
                {
                    type: SceneItemEnum.DEFAULT,
                    name: 'start',
                    handler: jest.fn(),
                },
                {
                    type: SceneItemEnum.DEFAULT,
                    handler: jest.fn(),
                },
                {
                    type: SceneItemEnum.DEFAULT,
                    name: 'end',
                    handler: jest.fn(),
                },
            ];

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                session: {
                    scene: {
                        name: scene.data.name,
                        current: 0,
                    }
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, [scene]);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);

            await context.scene!.jump('start');
            expect(context.session!.scene!.current).toStrictEqual(0);

            await context.scene!.jump('end');
            expect(context.session!.scene!.current).toStrictEqual(2);

            await context.scene!.next(-1);
            expect(context.session!.scene!.current).toStrictEqual(1);

            await context.scene!.next();
            expect(context.session!.scene!.current).toStrictEqual(2);
        });

        it('Check next then exit scene', async () => {
            const scene = SceneProvider({
                name: 'test',
                startQuery: 'test_query',
            });

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                session: {
                    scene: {
                        name: scene.data.name,
                        current: 0,
                    }
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, [scene]);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);

            await context.scene!.next();
            expect(scene.exited[0].handler).toBeCalledTimes(1);
            expect(context.session!.scene).toStrictEqual(undefined);
        });
    });

    describe('Check scene history behavior', () => {
        const logger: ILogger = LoggerProvider();

        it('Check correct behaviour when going back', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
                SceneProvider({
                    name: 'test2',
                    startQuery: 'test_query2',
                }),
                SceneProvider({
                    name: 'test3',
                    startQuery: 'test_query3',
                }),
            ];

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                session: {
                    scene: {
                        name: scenes[0].data.name,
                        current: 0,
                    }
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);

            await context.scene!.join(scenes[1].data.name);

            await context.scene!.join(scenes[2].data.name);

            await context.scene!.history!.back();

            expect(context.session!.scene.name).toStrictEqual(scenes[1].data.name);
            expect(context.scene!.history!.list.length).toStrictEqual(1);
        });

        it('Check correct behaviour when going back in nesting scenes navigation', async () => {
            const scenes: IScene[] = [
                SceneProvider({
                    name: 'test',
                    startQuery: 'test_query',
                }),
                SceneProvider({
                    name: 'test1',
                    startQuery: 'test_query1',
                }),
                SceneProvider({
                    name: 'test2',
                    startQuery: 'test_query2',
                }),
                SceneProvider({
                    name: 'test3',
                    startQuery: 'test_query3',
                }),
            ];

            const context = ContextProvider({
                from: {
                    id: 1,
                } as any,
                session: {
                    scene: {
                        name: scenes[0].data.name,
                        current: 0,
                    }
                }
            });

            const sceneMiddleware = new SceneMiddleware(logger, scenes);
            const next = jest.fn();

            await UseProvider(sceneMiddleware.init(), context as any, next);

            await context.scene!.join(scenes[1].data.name);

            await context.scene!.join(scenes[2].data.name);

            await context.scene!.join(scenes[3].data.name);

            await context.scene!.join(scenes[1].data.name);

            await context.scene!.history!.back();

            expect(context.session!.scene.name).toStrictEqual(scenes[0].data.name);
            expect(context.scene!.history!.list.length).toStrictEqual(0);
        });
    });
});
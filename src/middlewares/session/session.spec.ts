import { IContext } from '../../lib/bot.interface';
import { ContextProvider, LoggerProvider, RedisMockConfig, RedisProvider } from '../../test/common';
import { SessionMiddleware } from './session.middleware';

const mockRedis = new RedisProvider();

jest.mock('ioredis', () => {
    return jest.fn(() => {
        return mockRedis;
    });
});

describe('src/middlewares/session/session.middleware.ts', () => {
    const logger = LoggerProvider();

    let sessionMiddleware: SessionMiddleware;
    let context: Partial<IContext>;

    const fromId = 1;

    beforeEach(async () => {
        context = ContextProvider({
            from: {
                id: fromId,
            } as any,
        });
        sessionMiddleware = new SessionMiddleware(RedisMockConfig, logger);
    });

    afterEach(async () => {
        mockRedis.clearMock();
    });

    it('Check correct session get and save', async () => {
        const sessionBeforeSave = {
            test: 1,
        };

        Object.freeze(sessionBeforeSave);

        const next = async () => {
            context.session = JSON.parse(JSON.stringify(sessionBeforeSave));
        };

        await sessionMiddleware.init()(context as IContext, next);

        expect(context.session).toStrictEqual(sessionBeforeSave);
        const session = await mockRedis.get(sessionMiddleware.generateKey(fromId))
            .then((result) => result ? JSON.parse(result as string) : undefined);
        expect(session).toStrictEqual(sessionBeforeSave);
    });
});
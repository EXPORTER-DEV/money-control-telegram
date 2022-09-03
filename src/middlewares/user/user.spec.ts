import { IContext } from "../../lib/bot.interface";
import { ContextProvider, LoggerProvider, UseProvider } from "../../test/common";
import { UserMiddleware } from './user.middleware';
import DatabaseMiddleware from "../database";
import { ILogger } from "../../lib/logger/logger";

describe('src/middlewares/user/user.middleware.ts', () => {
    describe('Check middleware logic', () => {
        let context: Partial<IContext>;
        let database: DatabaseMiddleware;
        let logger: ILogger;
        let models: Record<string, unknown>;

        const fromId = 1;

        beforeEach(async () => {
            models = {};
            logger = LoggerProvider();
            database = new DatabaseMiddleware(models as any);
            context = ContextProvider({
                from: {
                    id: fromId,
                } as any,
            });
            await UseProvider(database.init(), context as any);
        });

        it('Check user creation', async () => {
            const userMiddleware = new UserMiddleware(logger);

            const model = {
                findById: jest.fn(async () => undefined),
                model: jest.fn(() => model),
                save: jest.fn(),
            };
            models.UserModel = model;

            const next = jest.fn();

            await UseProvider(userMiddleware.init(), context as any, next);

            expect(model.findById).toBeCalledTimes(1);
            expect(model.save).toBeCalledTimes(1);
            expect(next).toBeCalledTimes(1);
        });

        it('Check user get', async () => {
            const userMiddleware = new UserMiddleware(logger);

            const user = {
                id: 1,
                name: 'test',
            };

            const model = {
                findById: jest.fn(async () => user),
                model: jest.fn(() => model),
                save: jest.fn(),
            };
            models.UserModel = model;

            const next = jest.fn();

            await UseProvider(userMiddleware.init(), context as any, next);

            expect(model.findById).toBeCalledTimes(1);
            expect(model.save).toBeCalledTimes(0);
            expect(context.user).toStrictEqual(user);
            expect(next).toBeCalledTimes(1);
        });
    });
});
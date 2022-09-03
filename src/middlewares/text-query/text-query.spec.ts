import { ContextProvider, UseProvider } from "../../test/common";
import { TextQueryMiddleware } from './text-query.middleware';

const TEXT_QUERY = {
    test: 'TEST_QUERY',
};

jest.mock('../../navigation/text-query', () => ({
    TEXT_QUERY
}));

describe('src/middlewares/text-query/text-query.middleware.ts', () => {
    describe('Check base behavior', () => {
        it('Should match textQuery from message test', async () => {
            const context = ContextProvider({
                message: {
                    text: Object.keys(TEXT_QUERY)[0],
                } as any,
                from: {
                    id: 1,
                } as any,
            });

            const next = jest.fn();
            await UseProvider(TextQueryMiddleware, context as any, next);

            expect(context.textQuery).toStrictEqual(TEXT_QUERY.test);
            expect(next).toBeCalledTimes(1);
        });

        it('Should match textQuery from callbackQuery.data', async () => {
            const context = ContextProvider({
                callbackQuery: {
                    data: TEXT_QUERY.test,
                } as any,
                from: {
                    id: 1,
                } as any,
            });

            const next = jest.fn();
            await UseProvider(TextQueryMiddleware, context as any, next);

            expect(context.textQuery).toStrictEqual(TEXT_QUERY.test);
            expect(next).toBeCalledTimes(1);
        });
    });
});
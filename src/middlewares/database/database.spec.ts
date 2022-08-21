import { IContext } from "../../lib/bot.interface";
import { ContextProvider } from "../../test/common";
import { DatabaseMiddleware } from "./database.middleware";

class TestModel {}

const models: Record<string, unknown> = {
    TestModel: new TestModel(),
    TestStringDependecy: {test: 2},
};

describe('src/middlewares/database/database.middleware.ts', () => {
    let context: Partial<IContext>;
    let database: DatabaseMiddleware;
    beforeEach(async () => {
        context = ContextProvider();
        database = new DatabaseMiddleware(models as any);
    });

    it('Check Class -> Instance inject', () => {
        expect(database.inject(TestModel)).toStrictEqual(models.TestModel);
    });

    it('Check String -> Object inject', () => {
        expect(database.inject('TestStringDependecy')).toStrictEqual(models.TestStringDependecy);
    });
});
import { IContext } from "../lib/bot.interface";
import { ILogger } from "../lib/logger/logger";
import { IConfig } from "../middlewares/session/session.interface";

export const ContextProvider = (options?: Partial<IContext>): Partial<IContext> => ({
    session: {},
    answerCbQuery: jest.fn(async (): Promise<true> => true),
    replyWithMarkdown: jest.fn(async (): Promise<any> => ({})),
    editMessageText: jest.fn(async (): Promise<true> => true),
    reply: jest.fn(async (): Promise<any> => ({})),
    ...options,
});

type ProviderType = (ctx: Partial<IContext>, next: () => Promise<void>) => Promise<void>;

export const UseProvider = (
    handler: ProviderType,
    context: Partial<IContext>,
    next: () => Promise<void> = jest.fn(async () => {
        1;
    }),
) => handler(context, next);

export const LoggerProvider = (): ILogger => ({
    warn: () => undefined,
    info: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    child: (): ILogger => LoggerProvider(),
});

export class RedisProvider {
    public storage: Record<string, unknown> = {};
    on(event: string) {
        return event;
    }
    async get(key: string): Promise<unknown> {
        return this.storage[key];
    }
    async set(key: string, value: unknown): Promise<void> {
        this.storage[key] = value;
    }
    clearMock(): void {
        this.storage = {};
    }
}

export const RedisMockConfig: IConfig = {
    connection: {
        username: '',
        password: '',
        host: '',
        port: 1000,
        database: 1,
    },
    key: '',
};
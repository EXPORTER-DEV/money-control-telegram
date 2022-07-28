import { isNumber } from "class-validator";
import { IContext } from "../../lib/bot.interface";
import { ILogger } from "../../lib/logger/logger";
import { Scene } from "./scene";
import { ISceneInfo, IScenePositionResult, SceneItemEnum } from "./scene.interface";

const answerCbQuery = async (ctx: IContext) => {
    if (ctx.textQuery) {
        await ctx.answerCbQuery().catch(() => {
            // Use it for preventing sending callback_query event to bot again.
        });
    }  
};
export class SceneController {
    constructor(
        private ctx: IContext, 
        private middleware: SceneMiddleware,
        private historyMiddleware: SceneHistoryMiddleware,
    ) {}
    get history() {
        return {
            back: (count?: number, additionalOptions?: Record<string, any>, forceInit?: boolean) => this.historyMiddleware.back.call(this.historyMiddleware, count, additionalOptions, forceInit),
            current: this.ctx.session.scene.name,
            list: this.historyMiddleware.history,
            clear: () => this.historyMiddleware.clear.call(this.historyMiddleware),
        };
    }
    async join(name: string, options?: Record<string, any>, forceInit?: boolean): Promise<boolean> {
        this.historyMiddleware.push(this.ctx.session.scene, {name, ...options} as ISceneInfo);
        await this.exit();
        const find = this.middleware.findScene(name);
        if (find !== undefined) {
            const sceneInfo: ISceneInfo = {
                name,
                current: 0,
                ...options,
            };
            const joined = this.middleware.findScenePosition(find, SceneItemEnum.JOINED);
            this.ctx.session!.scene = sceneInfo;
            if (joined !== undefined) {
                await Promise.all([
                    ...joined.items.map((item) => item.handler(this.ctx))
                ]);
            }
            this.middleware.logger.debug({user: this.ctx.from!.id}, `Joined scene "${sceneInfo.name}", forceInit: ${forceInit ? 'true' : 'false'}, options: ${options ? JSON.stringify(options) : 'null'}`);
            if (forceInit === true) {
                const position = this.middleware.findScenePosition(find, SceneItemEnum.DEFAULT, sceneInfo.current);
                if (position !== undefined) {
                    await position.items[0].handler(this.ctx);
                }
            }
            await answerCbQuery(this.ctx);
            return true;
        } else {
            this.middleware.logger.warn({user: this.ctx.from!.id}, `Can't find scene "${name}".`);
        }
        await answerCbQuery(this.ctx);
        return false;
    }
    async next(step: number = 1, forceInit?: boolean) {
        if (this.ctx.session!.scene !== undefined) {
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if (find !== undefined) {
                const nextPosition = this.ctx.session!.scene!.current + step;
                const position = this.middleware.findScenePosition(find, SceneItemEnum.DEFAULT, nextPosition);
                if (position !== undefined && position.items.length > 0) {
                    this.ctx.session!.scene.current = nextPosition;
                    if (forceInit === true) {
                        await position.items[0].handler(this.ctx);
                    }
                } else {
                    await this.exit();
                }
            } else {
                this.ctx.session!.scene = undefined;
            }
        }
    }
    async jump(position: number | string, forceInit?: boolean) {
        if (this.ctx.session!.scene !== undefined) {
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if (find !== undefined) {
                const nextPosition = this.middleware.findScenePosition(find, SceneItemEnum.DEFAULT, position);
                if (nextPosition !== undefined && nextPosition.index !== undefined && nextPosition.items.length > 0) {
                    this.ctx.session!.scene.current = nextPosition.index;
                    if (forceInit === true) {
                        await nextPosition.items[0].handler(this.ctx);
                    }
                } else {
                    this.middleware.logger.warn({user: this.ctx.from!.id}, `Can't find position "${position}", scene: ${this.ctx.session!.scene!.name}.`);
                }
            } else {
                await this.exit();
            }
        }
    }
    async exit() {
        if (this.ctx.session!.scene !== undefined) {
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if (find !== undefined) {
                const exited = this.middleware.findScenePosition(find, SceneItemEnum.EXITED);
                this.middleware.logger.debug({user: this.ctx.from!.id}, `Exited scene "${this.ctx.session!.scene!.name}" from position "${this.ctx.session!.scene!.current}".`);
                this.ctx.session!.scene = undefined;
                if (exited !== undefined) {
                    await Promise.all([
                        ...exited.items.map((item) => item.handler(this.ctx))
                    ]);
                }
            }
        }
    }
}

export class SceneHistoryMiddleware {
    constructor(
        private ctx: IContext,
        private logger: ILogger,
    ) {
        this.logger = logger.child({module: 'SceneHistoryMiddleware'});
    }
    async back(count: number = 1, additionalOptions: Record<string, any> = {}, forceInit: boolean = false): Promise<boolean> {
        const sceneInfo = this.take(count);
        if (sceneInfo) {
            if (sceneInfo.name === this.ctx.session.scene.name) {
                return this.back(count + 1, additionalOptions, forceInit);
            }
            const { name, ...options} = sceneInfo;
            this.logger.debug({user: this.ctx.from!.id, sceneInfo, additionalOptions, referer: this.ctx.session.scene.name}, 'Removed item from history');
            this.ctx.textQuery = undefined;
            await this.ctx.scene.join(name, {...options, ...additionalOptions, referer: this.ctx.session.scene.name}, forceInit);
            return true;
        }
        return false;
    }
    public push(sceneInfo: ISceneInfo, newSceneInfo: ISceneInfo): void {
        if (!sceneInfo) return;
        const isBackDirection = this.history.findIndex(historySceneInfo => historySceneInfo.name === newSceneInfo.name);
        if (isBackDirection > -1) {
            this.history.splice(isBackDirection);
            return;
        }
        sceneInfo = {...sceneInfo};
        this.history.push(sceneInfo);
    }
    private take(count: number): ISceneInfo | undefined {
        if (this.history.length > 0) {
            return this.history.slice(-count)[0];
        }
        return undefined;
    }
    public clear(): void {
        this.logger.debug({user: this.ctx.from!.id}, 'Cleared history');
        this.history = [];
    }
    set history(value: ISceneInfo[]) {
        this.ctx.session.sceneHistory = value;
    }
    get history(): ISceneInfo[] {
        if (!this.ctx.session.sceneHistory) {
            this.ctx.session.sceneHistory = [];
        }
        return this.ctx.session.sceneHistory;
    }
}

export class SceneMiddleware {
    private list: Scene[] = [];
    readonly logger: ILogger;
    constructor(logger: ILogger, list: Scene[]) {
        this.logger = logger.child({module: 'SceneMiddleware'});
        for (const item of list) {
            const check = this.list.find((find) => find.data.name === item.data.name || find.data.startQuery === item.data.startQuery);
            if (check !== undefined) {
                const error = `Found duplicate for Scene "${item.data.name}", you can register only one scene with the same name or same startQuery.`;
                this.logger.error(error);
                throw new Error(error);
            }
            this.list.push(item);
            this.logger.info({scene: JSON.stringify(item)}, `Registered scene "${item.data.name}", startQuery: ${item.data.startQuery ? `[${[...(item.data.startQuery instanceof Array ? item.data.startQuery : [item.data.startQuery])].map((item) => `"${item}"`).join(',')}]`:  'false'}, joined events: ${item.joined.length}, exited events: ${item.exited.length}, callback events: ${item.callback.length}, default handlers: ${item.items.length}`);
        }
    }
    findSceneByQuery(query: string): Scene | undefined {
        return this.list.find((item) => {
            if (typeof item.data.startQuery === 'string') {
                return item.data.startQuery === query;
            } else if (item.data.startQuery !== undefined) {
                return item.data.startQuery!.indexOf(query) > -1;
            }
        });
    }
    findScene(name: string): Scene | undefined {
        return this.list.find((item) => item.data.name === name);
    }
    findScenePosition(scene: Scene, type: SceneItemEnum, position?: number | string): IScenePositionResult | undefined {
        if (type === SceneItemEnum.DEFAULT && position !== undefined) {
            if (isNumber(position)) {
                if (scene.items[+position] !== undefined) {
                    return {
                        items: [scene.items[+position]],
                        index: +position,
                    };
                }
            } else {
                let index: number = 0;
                const sceneItem = scene.items.find((item, i) => {
                    if (item.name === position) {
                        index = i;
                        return true;
                    }
                    return false;
                });
                if (sceneItem !== undefined) {
                    return {
                        items: [sceneItem],
                        index,
                    };
                }
            }
        }
        if (type === SceneItemEnum.EXITED && scene.exited.length > 0) {
            return {
                items: scene.exited,
            };
        }
        if (type === SceneItemEnum.JOINED && scene.joined.length > 0) {
            return {
                items: scene.joined,
            };
        }
        if (type === SceneItemEnum.CALLBACK && scene.callback.length > 0) {
            return {
                items: scene.callback,
            };
        }

        return undefined;
    }
    init() {
        return async (ctx: IContext, next: () => void) => {
            if (ctx.from) {
                const historyMiddleware = new SceneHistoryMiddleware(ctx, this.logger);
                const sceneController = new SceneController(ctx, this, historyMiddleware);
                ctx.scene = sceneController;
                // Callback query start
                if (ctx.textQuery) {
                    const findByQuery = this.findSceneByQuery(ctx.textQuery);
                    if (findByQuery !== undefined) {
                        await sceneController.join(findByQuery.data.name);
                        return;
                    }

                    const find = this.findScene(ctx.session?.scene?.name);
                    if (find !== undefined) {
                        const current = ctx.session.scene.name;
                        const callback = this.findScenePosition(find, SceneItemEnum.CALLBACK);
                        if (callback !== undefined) {
                            const result = await Promise.all([
                                ...callback.items.map((item) => item.handler(ctx))
                            ]);
                            // In case when Scene.callback has exited current scene or moved to another, then stop execution.
                            if (current !== ctx.session.scene?.name) {
                                return answerCbQuery(ctx);
                            }
                            // If one of result item is false, then stop execution:
                            if (result.some(res => res === false)) {
                                return answerCbQuery(ctx);
                            }
                        }
                    } else {
                        await sceneController.exit();
                    }
                }
                // Callback query end
                // Default start:
                if (ctx.session?.scene !== undefined) {
                    const find = this.findScene(ctx.session!.scene!.name);
                    if (find !== undefined) {
                        const result = this.findScenePosition(find, SceneItemEnum.DEFAULT, ctx.session!.scene!.current);
                        if (result !== undefined) {
                            await result.items[0].handler(ctx);
                            return answerCbQuery(ctx);
                        } else {
                            await sceneController.exit();
                        }
                    } else {
                        await sceneController.exit();
                    }
                }
                // Default end
                await next();
            } else {
                await next();
            }
        };
    }
}
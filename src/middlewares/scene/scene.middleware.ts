import { isNumber } from "class-validator";
import { ILogger } from "../../lib/logger/logger";
import { Scene, SceneItem } from "./scene";
import { ISceneInfo, IScenePositionResult, ISceneSessionContext, SceneItemEnum } from "./scene.interface";

export class SceneController {
    constructor(
        private ctx: ISceneSessionContext, 
        private middleware: SceneMiddleware
    ){}
    async join(name: string): Promise<boolean> {
        await this.exit();
        const find = this.middleware.findScene(name);
        if(find !== undefined){
            const sceneInfo: ISceneInfo = {
                name,
                current: 0,
            };
            const joined = this.middleware.findScenePosition(find, SceneItemEnum.JOINED);
            if(joined !== undefined){
                await Promise.all([
                    ...joined.items.map((item) => item.handler(this.ctx))
                ]);
            }
            this.middleware.logger.debug({user: this.ctx.from!.id}, `Joined scene "${sceneInfo.name}".`);
            this.ctx.session!.scene = sceneInfo;
            return true;
        }else{
            this.middleware.logger.warn({user: this.ctx.from!.id}, `Can't find scene "${name}".`);
        }
        return false;
    }
    async next(forceInit?: boolean){
        if(this.ctx.session!.scene !== undefined){
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if(find !== undefined){
                const nextPosition = this.ctx.session!.scene!.current + 1;
                const position = this.middleware.findScenePosition(find, SceneItemEnum.DEFAULT, nextPosition);
                if(position !== undefined && position.items.length > 0){
                    this.ctx.session!.scene.current = nextPosition;
                    if(forceInit === true){
                        await position.items[0].handler(this.ctx);
                    }
                }else{
                    await this.exit();
                }
            }else{
                this.ctx.session!.scene = undefined;
            }
        }
    }
    async jump(position: number | string, forceInit?: boolean){
        if(this.ctx.session!.scene !== undefined){
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if(find !== undefined){
                const nextPosition = this.middleware.findScenePosition(find, SceneItemEnum.DEFAULT, position);
                if(nextPosition !== undefined && nextPosition.index !== undefined && nextPosition.items.length > 0){
                    this.ctx.session!.scene.current = nextPosition.index;
                    if(forceInit === true){
                        await nextPosition.items[0].handler(this.ctx);
                    }
                }else{
                    this.middleware.logger.warn({user: this.ctx.from!.id}, `Can't find position "${position}", scene: ${this.ctx.session!.scene!.name}.`);
                }
            }else{
                await this.exit();
            }
        }
    }
    async exit(){
        if(this.ctx.session!.scene !== undefined){
            const find = this.middleware.findScene(this.ctx.session!.scene!.name);
            if(find !== undefined){
                const exited = this.middleware.findScenePosition(find, SceneItemEnum.EXITED);
                if(exited !== undefined){
                    await Promise.all([
                        ...exited.items.map((item) => item.handler(this.ctx))
                    ]);
                }
                this.middleware.logger.debug({user: this.ctx.from!.id}, `Exited scene "${this.ctx.session!.scene!.name}" from position "${this.ctx.session!.scene!.current}".`);
                this.ctx.session!.scene = undefined;
            }
        }
    }
}

export class SceneMiddleware {
    private list: Scene[] = [];
    readonly logger: ILogger;
    constructor(logger: ILogger, list: Scene[]){
        this.logger = logger.child({module: 'SceneMiddleware'});
        for(let item of list){
            const check = this.list.find((item) => item.data.name === item.data.name || item.data.startQuery === item.data.startQuery);
            if(check !== undefined){
                const error = `Found duplicate for Scene "${item.data.name}", you can register only one scene with the same name or same startQuery.`;
                this.logger.error(error);
                throw new Error(error);
            }
            this.list.push(item);
            this.logger.info({scene: JSON.stringify(item)}, `Registered scene "${item.data.name}", startQuery: "${item.data.startQuery ?? 'false'}", joined events: ${item.joined.length}, exited events: ${item.exited.length}, callback events: ${item.callback.length}, default handlers: ${item.items.length}`);
        }
    }
    findSceneByQuery(query: string): Scene | undefined {
        return this.list.find((item) => item.data.startQuery === query);
    }
    findScene(name: string): Scene | undefined {
        return this.list.find((item) => item.data.name === name);
    }
    findScenePosition(scene: Scene, type: SceneItemEnum, position?: number | string): IScenePositionResult | undefined {
        if(type === SceneItemEnum.DEFAULT && position !== undefined){
            if(isNumber(position)){
                if(scene.items[+position] !== undefined){
                    return {
                        items: [scene.items[+position]],
                        index: +position,
                    };
                }
            }else{
                let index: number = 0;
                const sceneItem = scene.items.find((item, i) => {
                    if(item.name === position){
                        index = i;
                        return true;
                    }
                    return false;
                });
                if(sceneItem !== undefined){
                    return {
                        items: [sceneItem],
                        index,
                    };
                }
            }
        }
        if(type === SceneItemEnum.EXITED && scene.exited.length > 0){
            return {
                items: scene.exited,
            }
        }
        if(type === SceneItemEnum.JOINED && scene.joined.length > 0){
            return {
                items: scene.joined,
            }
        }
        if(type === SceneItemEnum.CALLBACK && scene.callback.length > 0){
            return {
                items: scene.callback,
            }
        }

        return undefined;
    }
    init(){
        return async (ctx: ISceneSessionContext, next: Function) => {
            if (ctx.from) {
                const sceneController = new SceneController(ctx, this);
                ctx.scene = sceneController;
                // Callback start
                if(ctx.callbackQuery && ctx.callbackQuery.data){
                    if(ctx.session?.scene === undefined){
                        const find = this.findSceneByQuery(ctx.callbackQuery.data);
                        if(find !== undefined){
                            await sceneController.join(find.data.name);
                            return;
                        }
                    }else{
                        const find = this.findScene(ctx.session!.scene!.name);
                        if(find !== undefined){
                            const callback = this.findScenePosition(find, SceneItemEnum.CALLBACK);
                            if(callback !== undefined){
                                await Promise.all([
                                    callback.items.map((item) => item.handler(ctx))
                                ])
                            }
                        }else{
                            await sceneController.exit();
                        }
                    }
                }
                // Callback end
                // Default start:
                if(ctx.session?.scene !== undefined){
                    console.dir(ctx.session);
                    const find = this.findScene(ctx.session!.scene!.name);
                    if(find !== undefined){
                        const result = this.findScenePosition(find, SceneItemEnum.DEFAULT, ctx.session!.scene!.current);
                        if(result !== undefined){
                            await result.items[0].handler(ctx);
                            return;
                        }else{
                            await sceneController.exit();
                        }
                    }else{
                        await sceneController.exit();
                    }
                }
                // Default end
                await next();
            } else {
                await next();
            }
        }
    }
}
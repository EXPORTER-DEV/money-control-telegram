import { IScene, ISceneCreation, ISceneItemCreation, SceneItemEnum, SceneItemHandlerType } from "./scene.interface";

export class SceneItem {
    type: SceneItemEnum;
    name?: string;
    handler: SceneItemHandlerType;
    constructor(type: SceneItemEnum, handler: SceneItemHandlerType, data?: ISceneItemCreation) {
        this.type = type;
        this.handler = handler;
        if (data) {
            if (data.name !== undefined) {
                this.name = data.name;
            }
        }
    }
}

export class Scene implements IScene {
    data: ISceneCreation;
    items: SceneItem[] = [];
    joined: SceneItem[] = [];
    exited: SceneItem[] = [];
    callback: SceneItem[] = [];
    constructor(data: ISceneCreation, ...items: SceneItem[]) {
        this.data = data;
        for (const item of items) {
            if (item.type === SceneItemEnum.JOINED) {
                this.joined.push(item);
            }
            if (item.type === SceneItemEnum.EXITED) {
                this.exited.push(item);
            }
            if (item.type === SceneItemEnum.CALLBACK) {
                this.callback.push(item);
            }
            if (item.type === SceneItemEnum.DEFAULT) {
                this.items.push(item);
            }
        }
    }
    static joined(handler: SceneItemHandlerType): SceneItem {
        return new SceneItem(SceneItemEnum.JOINED, handler);
    }
    static exited(handler: SceneItemHandlerType): SceneItem {
        return new SceneItem(SceneItemEnum.EXITED, handler);
    }
    static callback(handler: SceneItemHandlerType): SceneItem {
        return new SceneItem(SceneItemEnum.CALLBACK, handler);
    }
    static default(name: string): SceneItem;
    static default(name: string, handler: SceneItemHandlerType): SceneItem;
    static default(handle: SceneItemHandlerType): SceneItem;
    static default(...args: any[]) {
        if (args.length >= 2) throw new Error(`Got ${args.length} argument(s), expected 2 / 1 argument.`);
        let name: string | undefined = undefined;
        let handler: SceneItemHandlerType | undefined = undefined;
        if (args.length === 1 && typeof args[0] === 'function') {
            handler = args[0];
        }
        if (args.length === 2 && (typeof args[0] === 'string' || typeof args[1] === 'function')) {
            name = args[0];
            handler = args[1];
        }
        if (!handler) throw new Error('Handler function is required.');
        return new SceneItem(SceneItemEnum.DEFAULT, handler, {
            name
        });
    }
}
import { Context } from "telegraf";
import { IContext } from "../../lib/bot.interface";
import { SceneItem } from "./scene";
import { SceneController } from "./scene.middleware";

export interface ISceneInfo {
    current: number;
    name: string;
    [key: string]: any;
}

export interface ISceneCreation {
    name: string;
    startQuery?: string | string[];
}

export interface IScene {
    data: ISceneCreation;
}

export interface ISceneSessionContext extends Context {
    session?: {
        scene?: ISceneInfo;
    },
    scene?: SceneController;
}

export interface ISceneItemCreation {
    name?: string;
}

export interface IScenePositionResult {
    items: SceneItem[];
    index?: number;
}

export type SceneItemHandlerType = (ctx: IContext) => Promise<any>;

export enum SceneItemEnum {
    JOINED = "JOINED",
    EXITED = "EXITED",
    CALLBACK = "CALLBACK",
    DEFAULT = "DEFAULT",
}
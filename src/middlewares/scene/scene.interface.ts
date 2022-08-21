import { Context } from "telegraf";
import { IContext } from "../../lib/bot.interface";
import { ILogger } from "../../lib/logger/logger";
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
    items: ISceneItem[];
    joined: ISceneItem[];
    exited: ISceneItem[];
    callback: ISceneItem[];
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

export type SceneItemHandlerType = (ctx: IContext) => Promise<unknown>;

export interface ISceneControllerHistory {
    back: (count?: number, additionalOptions?: Record<string, unknown>, forceInit?: boolean) => Promise<boolean>;
    current?: string;
    list: ISceneInfo[];
    clear: () => void;
}

export enum SceneItemEnum {
    JOINED = "JOINED",
    EXITED = "EXITED",
    CALLBACK = "CALLBACK",
    DEFAULT = "DEFAULT",
}

export interface ISceneController {
    history: ISceneControllerHistory;
    join: (name: string, options?: Record<string, unknown>, forceInit?: boolean) => Promise<boolean>;
    next: (step?: number, forceInit?: boolean) => Promise<void>;
    jump: (position: number | string, forceInit?: boolean) => Promise<void>;
    exit: () => Promise<void>;
}

export interface ISceneHistoryMiddleware {
    back: (count: number, additionalOptions: Record<string, unknown>, forceInit: boolean) => Promise<boolean>;
    push: (sceneInfo: ISceneInfo, newSceneInfo: ISceneInfo) => void;
    clear: () => void;
    history: ISceneInfo[];
}

export interface ISceneItem {
    type: SceneItemEnum;
    name?: string;
    handler: SceneItemHandlerType;
}

export interface ISceneMiddleware {
    readonly logger: ILogger;
    findSceneByQuery(query: string): IScene | undefined;
    findScene(name: string): IScene | undefined;
    findScenePosition(scene: IScene, type: SceneItemEnum, position?: number | string): IScenePositionResult | undefined;
    init: () => (ctx: IContext, next: () => void) => Promise<void>;
}
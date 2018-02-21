import Koa from "koa";
import { IAppState } from "../public/reducers";
import { ITrainerInstance } from "../src/models/trainer";

declare module "koa" {
    interface Context {
        render(): Promise<void>;
        preloadedState: Partial<IAppState>;
        trainer: ITrainerInstance | null | undefined;
    }
}
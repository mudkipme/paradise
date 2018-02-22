import Koa from "koa";
import { IAppState } from "../public/reducers";
import { Trainer } from "../src/models";

declare module "koa" {
    interface Context {
        render(): Promise<void>;
        preloadedState: Partial<IAppState>;
        trainer: Trainer | null | undefined;
    }
}
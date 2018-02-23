import Koa from "koa";
import { IAppState } from "../public/reducers";
import { Trainer } from "../src/models";

declare module "koa" {
    interface Context {
        render(): void;
        preloadedState: Partial<IAppState>;
        trainer: Trainer | null | undefined;
    }
}
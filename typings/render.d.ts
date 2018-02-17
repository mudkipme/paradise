import Koa from "koa";
import { IAppState } from "../public/reducers";

declare module "koa" {
    interface Context {
        render(): Promise<void>;
        preloadedState: Partial<IAppState>;
    }
}
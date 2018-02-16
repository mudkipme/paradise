import Koa from "koa";

declare module "koa" {
    interface Context {
        render(data?: { [key: string]: any }): Promise<void>;
    }
}
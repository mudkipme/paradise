import Koa from "koa";
import { Trainer } from "../src/models";

declare module "koa" {
    interface Context {
        render(): void;
        trainer: Trainer | null | undefined;
    }
}
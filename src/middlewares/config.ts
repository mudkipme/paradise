import { Context } from "koa";
import nconf from "../lib/config";

export function middleware() {
    return async (ctx: Context, next: () => Promise<void>) => {
        ctx.preloadedState.config = {
            loginStrategies: nconf.get("login:strategies"),
        };
        await next();
    };
}

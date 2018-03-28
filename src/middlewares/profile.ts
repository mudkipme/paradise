import { Context } from "koa";

export function middleware() {
    return async (ctx: Context, next: () => Promise<void>) => {
        ctx.trainer = ctx.state.user;
        await next();
    };
}

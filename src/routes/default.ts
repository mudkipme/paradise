import { Context } from "koa";

export default function() {
    return async (ctx: Context, next: () => Promise<void>) => {
        await next();
        if (ctx.status !== 404 || ctx.body) {
            return;
        }
        await ctx.render();
    };
}

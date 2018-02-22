import { Context } from "koa";

export function middleware() {
    return async (ctx: Context, next: () => Promise<void>) => {
        ctx.trainer = ctx.state.user;
        if (ctx.isAuthenticated() && ctx.trainer) {
            ctx.preloadedState.profile = {
                hasLogin: true,
                me: ctx.trainer.serializePrivate(),
            };
        }
        await next();
    };
}

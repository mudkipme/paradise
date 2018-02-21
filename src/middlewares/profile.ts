import { Context } from "koa";

export function middleware() {
    return async (ctx: Context, next: () => Promise<void>) => {
        ctx.trainer = ctx.state.user;
        if (ctx.isAuthenticated() && ctx.trainer) {
            ctx.preloadedState.profile = {
                displayName: ctx.trainer.profile.displayName,
                hasLogin: true,
                id: ctx.trainer.profile.id,
                provider: ctx.trainer.profile.provider,
            };
        }
        await next();
    };
}

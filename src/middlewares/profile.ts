import { Context } from "koa";

export function middleware() {
    return async (ctx: Context, next: () => Promise<void>) => {
        if (ctx.isAuthenticated()) {
            ctx.preloadedState.profile = {
                displayName: ctx.state.user.displayName,
                hasLogin: true,
                id: ctx.state.user.id,
                provider: ctx.state.user.provider,
            };
        }
        await next();
    };
}

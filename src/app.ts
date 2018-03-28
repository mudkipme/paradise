import Koa from "koa";
import bodyParser from "koa-bodyparser";
import compress from "koa-compress";
import favicon from "koa-favicon";
import error from "koa-json-error";
import redisStore from "koa-redis";
import session from "koa-session";
import serve from "koa-static";
import path from "path";
import { URL } from "url";
import nconf from "./lib/config";
import { sequelize } from "./lib/database";
import logger from "./lib/logger";
import passport from "./lib/passport";
import { middleware as profileMiddleware } from "./middlewares/profile";
import { middleware as renderMiddleware } from "./middlewares/render";
import authRouter from "./routes/auth";
import defaultRoute from "./routes/default";
import graphqlRouter from "./routes/graphql";

const app = new Koa();
app.keys = [nconf.get("app:cookieSecret")];
app.use(session({ store: redisStore(nconf.get("app:database:redis")) }, app));
app.use(compress());
app.use(favicon(path.join(__dirname, "../public/images/favicon.ico")));
app.use(bodyParser());
app.use(serve(path.join(__dirname, "../public")));
app.use(error());
app.use(renderMiddleware());
app.use(passport.initialize());
app.use(passport.session());
app.use(profileMiddleware());
app.use(authRouter.routes());
app.use(graphqlRouter.routes());
app.use(graphqlRouter.allowedMethods());
app.use(defaultRoute());

export default app;

async function start() {
    await sequelize.sync();
    const url = new URL(nconf.get("app:url"));

    const server = app.listen(url.port || 3000, () => {
        logger.info("Paradise server listening on port " + server.address().port);
    });
}

start().catch((err: Error) => {
    logger.error(err.message);
});

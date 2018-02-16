import Router from "koa-router";
import nconf from "../lib/config";
import passport, { strategies } from "../lib/passport";

const router = new Router({
    prefix: "/auth",
});

if (strategies.has("github")) {
    router.get("/github", passport.authenticate("github"));
    router.get("/github/callback", passport.authenticate("github", {
        failureRedirect: "/login",
    }));
}

export default router;

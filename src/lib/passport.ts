import passport from "koa-passport";
import { Strategy as GithubStrategy } from "passport-github";
import { URL } from "url";
import nconf from "./config";

export const strategies = new Set(nconf.get("login:strategies"));

if (strategies.has("github")) {
    const url = new URL(nconf.get("app:url"));
    url.pathname = "/auth/github/callback";

    passport.use(new GithubStrategy({
        callbackURL: url.toString(),
        clientID: nconf.get("login:github:clientID"),
        clientSecret: nconf.get("login:github:clientSecret"),
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // TODO: find or create trainer
            done(null, profile);
        } catch (error) {
            done(error);
        }
    }));
}

export default passport;

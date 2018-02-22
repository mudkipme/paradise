import passport from "koa-passport";
import { Strategy as GithubStrategy } from "passport-github";
import { URL } from "url";
import { IProfile } from "../../public/interfaces/trainer-interface";
import { Trainer } from "../models";
import nconf from "./config";

export const strategies = new Set(nconf.get("login:strategies"));

passport.serializeUser<Trainer, string>(async (user, done) => {
    try {
        done(null, user.id);
    } catch (error) {
        done(error);
    }
});

passport.deserializeUser<Trainer, string>(async (id, done) => {
    try {
        const trainer = await Trainer.findById(id);
        if (!trainer) {
            done(new Error("TRAINER_NOT_FOUND"));
            return;
        }
        done(null, trainer);
    } catch (err) {
        done(err);
    }
});

if (strategies.has("github")) {
    const url = new URL(nconf.get("app:url"));
    url.pathname = "/auth/github/callback";

    passport.use(new GithubStrategy({
        callbackURL: url.toString(),
        clientID: nconf.get("login:github:clientID"),
        clientSecret: nconf.get("login:github:clientSecret"),
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const trainer = await findOrCreateUser(profile);
            done(null, trainer);
        } catch (error) {
            done(error);
        }
    }));
}

async function findOrCreateUser(profile: IProfile) {
    const defaults = {
        lastLogin: new Date(),
        name: profile.displayName,
        profile: {
            displayName: profile.displayName,
            id: profile.id,
            provider: profile.provider,
        },
    };
    const [ trainer, created ] = await Trainer.findOrCreate({
        defaults,
        where: {
            profile: {
                id: profile.id,
                provider: profile.provider,
            },
        },
    });
    return trainer;
}

export default passport;

import nconf from "nconf";

nconf.argv()
    .env();

if (nconf.get("config")) {
    nconf.file({
        file: nconf.get("config"),
    });
} else {
    nconf.file({
        file: "config.json",
    });
}

nconf.defaults({
    app: {
        cookieSecret: "my little secret",
        defaultTimezone: "UTC",
        url: "http://localhost:3000",
    },
    login: {
        strategies: ["github"],
    },
    pokeapi: {
        cacheLimit: 3600000,
    },
});

export default nconf;

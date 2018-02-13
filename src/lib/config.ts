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
    },
});

export default nconf;

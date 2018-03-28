import nconf from "../../lib/config";

const resolver = () => ({
    loginStrategies: nconf.get("login:strategies"),
});

export default resolver;

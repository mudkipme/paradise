import { importSchema } from "graphql-import";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";
import config from "./config/resolver";
import { currentTrainer } from "./trainer/resolver";

const typeDefs = importSchema(path.join(__dirname, "schema.graphql"));
const resolvers = {
    Query: {
        config,
        currentTrainer,
    },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
export default schema;

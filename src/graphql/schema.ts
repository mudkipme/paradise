import { importSchema } from "graphql-import";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";
import config from "./config/resolver";
import Pokemon from "./pokemon/resolver";
import Trainer, { currentTrainer } from "./trainer/resolver";

const typeDefs = importSchema(path.join(__dirname, "schema.graphql"));
const resolvers = {
    Pokemon,
    Query: {
        config,
        currentTrainer,
    },
    Trainer,
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
export default schema;

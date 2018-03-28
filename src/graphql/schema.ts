import { importSchema } from "graphql-import";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";

const typeDefs = importSchema(path.join(__dirname, "schema.graphql"));
const resolvers = {};

const schema = makeExecutableSchema({ typeDefs, resolvers });
export default schema;

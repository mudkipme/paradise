import { graphqlKoa } from "apollo-server-koa";
import Router from "koa-router";
import schema from "../graphql/schema";

const router = new Router();

router.post("/graphql", graphqlKoa({ schema }));
router.get("/graphql", graphqlKoa({ schema }));

export default router;

import { graphqlKoa } from "apollo-server-koa";
import { Context } from "koa";
import Router from "koa-router";
import schema from "../graphql/schema";

const router = new Router();

const options = (context: Context) => ({
    context,
    schema,
});

router.post("/graphql", graphqlKoa(options));
router.get("/graphql", graphqlKoa(options));

export default router;

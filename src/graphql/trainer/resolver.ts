import { GraphQLFieldResolver } from "graphql";
import { Context } from "koa";

export const currentTrainer: GraphQLFieldResolver<undefined, Context> = (obj, args, context, info) => {
    return context.trainer;
};

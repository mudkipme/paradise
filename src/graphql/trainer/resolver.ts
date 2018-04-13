import { GraphQLFieldResolver } from "graphql";
import { Context } from "koa";
import { Trainer } from "../../models";

export const currentTrainer: GraphQLFieldResolver<undefined, Context> = (obj, args, context, info) => {
    return context.trainer;
};

const TrainerResolver = {
    party(trainer: Trainer) {
        return trainer.getParty();
    },
};

export default TrainerResolver;

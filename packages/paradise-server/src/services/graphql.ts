import path from 'path';
import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { PokemonResolvers, Resolvers } from '../generated/graphql';
import trainerResolvers, { resolveTrainerParty } from '../graphql/trainer-resolvers';
import { Context } from '../graphql/context';
import pokemonResolvers from '../graphql/pokemon-resolvers';

export async function schema() {
  return loadSchema(path.join(__dirname, '..', 'graphql', 'schema.graphql'), {
    loaders: [
      new GraphQLFileLoader(),
    ],
  });
}

export const resolvers: Resolvers<Context> = {
  Query: {
    currentTrainer: async (_parent, _args, ctx) => {
      if (!ctx.trainerId) {
        return null;
      }
      const trainer = await ctx.cradle.trainerService.trainerWithParty(ctx.trainerId);
      if (!trainer) {
        return null;
      }
      return resolveTrainerParty(trainer);
    },
  },
  Trainer: trainerResolvers,
  Pokemon: pokemonResolvers as PokemonResolvers<Context>,
};

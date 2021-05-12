import { Pokemon } from '@mudkipme/paradise-prisma';
import { PokemonResolvers } from '../generated/graphql';
import { Context } from './context';
import { resolveTrainer } from './trainer-resolvers';

const pokemonResolvers: PokemonResolvers<Context, Pokemon> = {
  stats: async (parent, _args, ctx) => ctx.cradle.pokemonService.getStats(parent),
  trainer: async (parent, _args, ctx) => {
    const trainer = await ctx.cradle.pokemonService.getTrainer(parent);
    return trainer ? resolveTrainer(trainer) : null;
  },
  originalTrainer: async (parent, _args, ctx) => {
    const trainer = await ctx.cradle.database.pokemon.findUnique({ where: { id: parent.id } }).originalTrainer();
    return trainer ? resolveTrainer(trainer) : null;
  },
  mother: async (parent, _args, ctx) => ctx.cradle.database.pokemon.findUnique({ where: { id: parent.id } }).mother(),
  father: async (parent, _args, ctx) => ctx.cradle.database.pokemon.findUnique({ where: { id: parent.id } }).father(),
};

export default pokemonResolvers;

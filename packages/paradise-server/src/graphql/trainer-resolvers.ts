import { Pokemon, Trainer, TrainerPokemon } from '@mudkipme/paradise-prisma';
import { ResolversTypes, TrainerResolvers, TrainerStatistics } from '../generated/graphql';
import { defaultStatistics } from '../data-service/trainer';
import { Context } from './context';

export const resolveTrainer = async (trainer: Trainer): Promise<ResolversTypes['Trainer']> => {
  const statistics = trainer.statistics
    ? trainer.statistics as TrainerStatistics : defaultStatistics;
  return {
    id: trainer.id,
    name: trainer.name,
    pokedexCaughtNum: trainer.pokedexCaughtNum,
    pokedexSeenNum: trainer.pokedexSeenNum,
    acceptBattle: trainer.acceptBattle,
    statistics,
    lastLogin: trainer.lastLogin,
    battlePoint: trainer.battlePoint,
  };
};

type TrainerWithParty = Trainer & { trainerPokemon: (TrainerPokemon & { pokemon: Pokemon })[] };

export const resolveTrainerParty = async (trainer: TrainerWithParty): Promise<ResolversTypes['Trainer']> => {
  const resolvedTrainer = await resolveTrainer(trainer);
  return {
    ...resolvedTrainer,
    party: trainer.trainerPokemon.filter((tp) => tp.boxId === -1).map((tp) => tp.pokemon),
  };
};

const trainerResolvers: TrainerResolvers<Context> = {
  party: async (parent, _args, ctx) => {
    if (parent.party) {
      return parent.party;
    }

    const party = await ctx.cradle.trainerService.getParty(parent.id!);
    return party.map((tp) => tp.pokemon);
  },
};

export default trainerResolvers;

import { Pokemon, PrismaClient, Trainer } from '@mudkipme/paradise-prisma';
import BitArray from 'bit-array';
import { Item, Location } from 'pokedex-promise-v2';
import { TrainerStatistics } from '../generated/graphql';
import { PokemonService } from './pokemon';
import { POKEDEX_MAX } from './species';
import { defaultStatistics, TrainerService } from './trainer';

export type PokedexStore = {
  caught?: string;
  seen?: string;
  seenM?: string;
  seenF?: string;
  seenMS?: string;
  seenFS?: string;
  formM?: string;
  formF?: string;
  formMS?: string;
  formFS?: string;
};

export default function pokedexService(
  database: PrismaClient,
  pokemonService: PokemonService,
  trainerService: TrainerService,
) {
  const setPokemonSeen = async (trainer: Trainer, pokemon: Pokemon) => {
    if (pokemon.isEgg) {
      return trainer;
    }
    const hex = (trainer.pokedexHex || {}) as PokedexStore;
    const seen = new BitArray(POKEDEX_MAX, hex.seen);
    seen.set(pokemon.speciesNumber, true);
    hex.seen = seen.toHexString();
    const pokedexSeenNum = seen.count();

    let dexKey: keyof PokedexStore;
    if (pokemon.formIdentifier && pokemon.isShiny && pokemon.gender === 'Female') {
      dexKey = 'formFS';
    } else if (pokemon.formIdentifier && pokemon.isShiny) {
      dexKey = 'formMS';
    } else if (pokemon.formIdentifier && pokemon.gender === 'Female') {
      dexKey = 'formF';
    } else if (pokemon.formIdentifier) {
      dexKey = 'formM';
    } else if (pokemon.isShiny && pokemon.gender === 'Female') {
      dexKey = 'seenFS';
    } else if (pokemon.isShiny) {
      dexKey = 'seenMS';
    } else if (pokemon.gender === 'Female') {
      dexKey = 'seenF';
    } else {
      dexKey = 'seenM';
    }

    const dex = new BitArray(POKEDEX_MAX, hex[dexKey]);
    if (pokemon.formIdentifier) {
      const species = await pokemonService.getSpecies(pokemon);
      dex.set(species.pokemonForme.id % 10000, true);
    } else {
      dex.set(pokemon.speciesNumber, true);
    }
    hex[dexKey] = dex.toHexString();
    return database.trainer.update({
      where: { id: trainer.id },
      data: { pokedexHex: hex, pokedexSeenNum },
    });
  };

  const setPokedexCaught = async (trainer: Trainer, pokemon: Pokemon) => {
    await setPokemonSeen(trainer, pokemon);
    const hex = (trainer.pokedexHex || {}) as PokedexStore;
    const caught = new BitArray(POKEDEX_MAX, hex.caught);
    caught.set(pokemon.speciesNumber, true);
    hex.caught = caught.toHexString();
    return database.trainer.update({
      where: { id: trainer.id },
      data: { pokedexHex: hex, pokedexCaughtNum: caught.count() },
    });
  };

  const hasCaught = (trainer: Trainer, speciesNumber: number) => {
    const hex = (trainer.pokedexHex || {}) as PokedexStore;
    const caught = new BitArray(POKEDEX_MAX, hex.caught);
    return caught.get(speciesNumber);
  };

  /**
   * Catch a Pokémon
   * @param  {Pokemon}   pokemon  The Pokémon to be caught
   * @param  {Item}      pokeBall The Poké Ball to use
   * @param  {Location}  location The location where the Pokémon was encountered
   */
  const catchPokemon = async (trainer: Trainer, pokemon: Pokemon, pokeBall: Item, location: Location) => {
    const [query, species] = await Promise.all([
      database.trainerPokemon.aggregate({
        max: { slot: true },
        where: { boxId: -1 },
      }),
      pokemonService.getSpecies(pokemon),
    ]);
    let slot = (query.max.slot ?? 0) + 1;
    let boxId = -1;
    if (slot > 6) {
      const storage = await trainerService.storageSlot(trainer);
      boxId = storage.boxId;
      slot = storage.boxSlot;
    }

    const statistics = (trainer.statistics as TrainerStatistics | null) || defaultStatistics;
    statistics.catchTime += 1;

    const [updatedTrainer, updatedPokemon] = await database.$transaction([
      database.trainer.update({
        where: { id: trainer.id },
        data: {
          trainerPokemon: {
            create: { boxId, slot, pokemonId: pokemon.id },
          },
          statistics,
        },
      }),
      database.pokemon.update({
        where: { id: pokemon.id },
        data: {
          originalTrainerId: pokemon.originalTrainerId || trainer.id,
          happiness: species.pokemonSpecies.base_happiness,
          pokeBallId: pokeBall.id,
          meetDate: new Date(),
          meetLevel: pokemon.level,
          meetPlaceIndex: location.name,
        },
      }),
    ]);

    return setPokedexCaught(updatedTrainer, updatedPokemon);
  };

  return {
    setPokemonSeen,
    setPokedexCaught,
    hasCaught,
    catchPokemon,
  };
}

import { Pokemon, PrismaClient, Trainer } from '@mudkipme/paradise-prisma';
import Pokedex, { ChainLink, Item, Location } from 'pokedex-promise-v2';
import error, { ErrorMessage } from '../services/error';
import { PokemonService } from './pokemon';
import { SpeciesService } from './species';
import { TrainerService } from './trainer';

export interface EvolveOptions {
  location?: Location;
  turnUpsideDown?: boolean;
  item?: Item;
  tradePokemon?: Pokemon;
}

export default function evolutionService({
  pokedex, pokemonService, trainerService, speciesService, database,
} : {
  pokedex: Pokedex,
  pokemonService: PokemonService,
  trainerService: TrainerService,
  speciesService: SpeciesService,
  database: PrismaClient
}) {
  const speciesListOfTrainerParty = async (trainer: Trainer | null) => {
    if (!trainer) {
      return [];
    }
    const party = await trainerService.getParty(trainer.id);
    return Promise.all(party.map((entry) => entry.pokemon)
      .map((pokemon) => pokemonService.getSpecies(pokemon)));
  };

  const findEvolution = async (pokemon: Pokemon, trigger: string, options: EvolveOptions) => {
    const [species, holdItem, trainer] = await Promise.all([
      pokemonService.getSpecies(pokemon),
      pokemonService.getHoldItem(pokemon),
      pokemonService.getTrainer(pokemon),
    ]);
    // Pokémon can't evolve when holding an Everstone
    if (holdItem && holdItem.name === 'everstone') {
      return null;
    }
    const [evolvesTo, stats] = await Promise.all([species.evolvesTo(), pokemonService.getStats(pokemon)]);

    let evolvableChain: ChainLink | null = null;
    for (const chain of evolvesTo) {
      if (!chain.evolution_details) {
        continue;
      }
      for (const evolutionDetail of chain.evolution_details) {
        if (evolutionDetail.trigger.name !== trigger) {
          continue;
        }
        if (evolutionDetail.location && (!options.location
          || options.location.name !== evolutionDetail.location.name)) {
          continue;
        }
        if (evolutionDetail.min_happiness && pokemon.happiness < evolutionDetail.min_happiness) {
          continue;
        }
        if (evolutionDetail.min_beauty) {
          continue;
        }
        // Pokémon can evolve when meets the level that the move can be learned
        if (evolutionDetail.known_move) {
          const moveDetail = species.learnMoveDetail(evolutionDetail.known_move.name);
          if (!moveDetail || moveDetail.move_learn_method.name !== 'level-up'
            || pokemon.level < moveDetail.level_learned_at) {
            continue;
          }
        }
        // TODO: Pokémon holding a Type-specific Item can evolve
        if (evolutionDetail.known_move_type) {
          continue;
        }
        if (evolutionDetail.party_type) {
          const speciesList = await speciesListOfTrainerParty(trainer);
          const found = speciesList.some((entry) => entry.pokemon.types
            .some((pokemonType) => pokemonType.type.name === evolutionDetail.party_type!.name));
          if (!found) {
            continue;
          }
        }
        if (evolutionDetail.time_of_day === 'day' && (!trainer || trainerService.timeOfDay(trainer) === 'night')) {
          continue;
        }
        if (evolutionDetail.time_of_day === 'night' && (!trainer || trainerService.timeOfDay(trainer) !== 'night')) {
          continue;
        }
        if (evolutionDetail.time_of_day === 'evening'
          && (!trainer || trainerService.timeOfDay(trainer) !== 'evening')) {
          continue;
        }
        // TODO: min affection
        if (evolutionDetail.min_affection) {
          continue;
        }
        if (evolutionDetail.min_level && pokemon.level < evolutionDetail.min_level) {
          continue;
        }
        if (evolutionDetail.turn_upside_down && !options.turnUpsideDown) {
          continue;
        }
        if (evolutionDetail.held_item && (!holdItem || holdItem.name !== evolutionDetail.held_item.name)) {
          continue;
        }
        if (evolutionDetail.item && (!options.item || options.item.name !== evolutionDetail.item.name)) {
          continue;
        }
        if (evolutionDetail.relative_physical_stats === 1 && stats!.attack! <= stats!.defense!) {
          continue;
        }
        if (evolutionDetail.relative_physical_stats === 0 && stats!.attack !== stats!.defense) {
          continue;
        }
        if (evolutionDetail.relative_physical_stats === -1 && stats!.attack! >= stats!.defense!) {
          continue;
        }
        if (evolutionDetail.party_species) {
          const speciesList = await speciesListOfTrainerParty(trainer);
          const found = speciesList.some((entry) => entry.pokemonSpecies.name === evolutionDetail.party_species!.name);
          if (!found) {
            continue;
          }
        }
        if (evolutionDetail.gender === 1 && pokemon.gender !== 'Female') {
          continue;
        }
        if (evolutionDetail.gender === 2 && pokemon.gender !== 'Male') {
          continue;
        }
        if (evolutionDetail.trade_species) {
          if (!options.tradePokemon) {
            continue;
          }
          const tradePokemonSpecies = await pokemonService.getSpecies(options.tradePokemon);
          if (evolutionDetail.trade_species.name !== tradePokemonSpecies.pokemonSpecies.name) {
            continue;
          }
        }
        // TODO: get the local weather from OpenWeatherMap
        if (evolutionDetail.needs_overworld_rain) {
          continue;
        }
        evolvableChain = chain;
        break;
      }
      if (evolvableChain) {
        break;
      }
    }
    if (!evolvableChain) {
      return null;
    }
    const pokemonSpecies = await pokedex.resource(evolvableChain.species.url);
    return speciesService.find(pokemonSpecies.id, pokemon.formIdentifier);
  };

  // Evolve this Pokémon
  const evolve = async (pokemon: Pokemon, trigger: string, options: EvolveOptions = {}) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonService.pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }
    const newSpecies = await findEvolution(pokemon, trigger, options);
    if (newSpecies) {
      return database.pokemon.update({
        where: { id: pokemon.id },
        data: {
          speciesNumber: newSpecies.pokemonSpecies.id,
          formIdentifier: newSpecies.pokemonForme.form_name,
        },
      });
    }
    return pokemon;
  };

  return {
    findEvolution,
    evolve,
  };
}

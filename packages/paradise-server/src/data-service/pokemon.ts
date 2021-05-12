import Pokedex, { Item, Nature } from 'pokedex-promise-v2';
import {
  random, keyBy, range, sum,
} from 'lodash';
import {
  Gender, Pokemon, PrismaClient, Trainer,
} from '@mudkipme/paradise-prisma';
import { PokemonStats, HatchRate } from '../generated/graphql';
import { Config } from '../services/config';
import { SpeciesService } from './species';
import { TrainerService } from './trainer';
import error, { ErrorMessage } from '../services/error';

export interface PokemonCreateOptions {
  speciesNumber: number;
  formIdentifier?: string;
  isEgg?: boolean;
  level?: number;
  gender?: Gender;
  nature?: Nature;
  individual?: PokemonStats;
  effort?: PokemonStats;
  isShiny?: boolean;
  happiness?: number;
  originalTrainer?: Trainer;
  displayOT?: string;
  birthDate?: Date;
  father?: Pokemon;
  mother?: Pokemon;
  holdItem?: Item;
}

const NATURE_COUNT = 25;
const statNames = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  specialAttack: 'special-attack',
  specialDefense: 'special-defense',
  speed: 'speed',
};

const makeStats = (values: PokemonStats | undefined, generator?: () => number): PokemonStats => ({
  hp: values?.hp ?? generator?.() ?? 0,
  attack: values?.attack ?? generator?.() ?? 0,
  defense: values?.defense ?? generator?.() ?? 0,
  specialAttack: values?.specialAttack ?? generator?.() ?? 0,
  specialDefense: values?.specialDefense ?? generator?.() ?? 0,
  speed: values?.speed ?? generator?.() ?? 0,
});

export default function pokemonService(
  database: PrismaClient,
  config: Config,
  pokedex: Pokedex,
  speciesService: SpeciesService,
  trainerService: TrainerService,
) {
  const createPokemon = async (options: PokemonCreateOptions) => {
    const species = await speciesService.find(options.speciesNumber, options.formIdentifier);
    const level = options.isEgg ? 1 : (options.level || 5);
    const experience = await species.experience(level);

    // Gender
    let gender: Gender;
    if (species.pokemonSpecies.gender_rate === -1) {
      gender = Gender.Genderless;
    } else if (species.pokemonSpecies.gender_rate === 0) {
      gender = Gender.Male;
    } else if (species.pokemonSpecies.gender_rate === 8) {
      gender = Gender.Female;
    } else if (options.gender) {
      gender = options.gender;
    } else {
      gender = random(0, 7) < species.pokemonSpecies.gender_rate ? Gender.Female : Gender.Male;
    }

    // Nature
    const natureId = options.nature ? options.nature.id : random(1, NATURE_COUNT);

    // Alternate color
    const isShiny = typeof options.isShiny === 'boolean' ? options.isShiny : random(0, 4096) === 0;

    const pokemon = await database.pokemon.create({
      data: {
        birthDate: options.birthDate || new Date(),
        displayOT: options.displayOT,
        effort: makeStats(options.effort),
        experience,
        father: options.father ? { connect: options.father } : undefined,
        formIdentifier: species.pokemonForme.form_name,
        gender,
        happiness: options.happiness || species.pokemonSpecies.base_happiness,
        holdItemId: options.holdItem ? options.holdItem.id : null,
        individual: makeStats(options.individual, () => random(0, 31)),
        isEgg: options.isEgg ?? false,
        isShiny,
        level,
        mother: options.mother ? { connect: options.mother } : undefined,
        natureId,
        speciesNumber: species.pokemonSpecies.id,
        originalTrainer: options.originalTrainer ? { connect: options.originalTrainer } : undefined,
      },
    });
    return pokemon;
  };

  // Shorter ID String
  const displayId = (pokemon: Pokemon) => pokemon.id.substr(-6);

  // Get the Species of this Pokémon
  const getSpecies = (pokemon: Pokemon) => speciesService.find(pokemon.speciesNumber, pokemon.formIdentifier);

  // Get the Nature of this Pokémon, return a Promise object
  const getNature = (pokemon: Pokemon) => pokedex.getNatureByName(pokemon.natureId);

  // Get the Poké Ball of this Pokémon, return a Promise object
  const getPokeBall = async (pokemon: Pokemon) => (
    pokemon.pokeBallId ? pokedex.getItemByName(pokemon.pokeBallId) : null
  );

  // Get the hold item of this Pokémon, return a Promise object
  const getHoldItem = async (pokemon: Pokemon) => (
    pokemon.holdItemId ? pokedex.getItemByName(pokemon.holdItemId) : null
  );

  // Pokémon Stats, return a Promise object
  const getStats = async (pokemon: Pokemon) => {
    if (pokemon.isEgg) {
      return null;
    }
    const [species, nature] = await Promise.all([getSpecies(pokemon), getNature(pokemon)]);
    const stats = keyBy(species.pokemon.stats, 'stat.name');
    const result: PokemonStats = {};
    let { lostHp } = pokemon;
    const individual = pokemon.individual as PokemonStats;
    const effort = pokemon.effort as PokemonStats;

    result.maxHp = Math.round(((individual.hp! + 2 * stats.hp.base_stat + effort.hp!
      / 4 + 100) * pokemon.level) / 100 + 10);

    if (pokemon.pokemonCenter) {
      lostHp -= Math.floor(((Date.now() - pokemon.pokemonCenter.getTime()) / 36e5) * config.get('app.pokemonCenterHP'));
    }

    lostHp = Math.max(Math.min(lostHp, result.maxHp), 0);
    result.hp = result.maxHp - lostHp;

    for (const [key, value] of Object.entries(statNames)) {
      const type = key as keyof typeof statNames;
      let multiplier = 1;
      if (nature.decreased_stat.name === value) {
        multiplier = 0.9;
      }
      if (nature.increased_stat.name === value) {
        multiplier = 1.1;
      }
      result[type] = Math.round((((individual[type]! + 2 * stats[type].base_stat + effort[type]! / 4)
        * pokemon.level) / 100 + 5) * multiplier);
    }

    return result as Readonly<PokemonStats>;
  };

  // Caculate the rest time in Pokémon Center
  const pokemonCenterTime = async (pokemon: Pokemon) => {
    if (!pokemon.pokemonCenter) {
      return 0;
    }

    let time = (pokemon.lostHp / config.get('app.pokemonCenterHP')) * 36e5
            + pokemon.pokemonCenter.getTime() - Date.now();
    time = Math.ceil(Math.max(time, 0));

    if (pokemon.pokemonCenter && time === 0) {
      await database.pokemon.update({
        where: { id: pokemon.id },
        data: {
          pokemonCenter: null,
          lostHp: 0,
        },
      });
    }
    return time;
  };

  // Experience of the current level of this Pokémon
  const expCurrentLevel = async (pokemon: Pokemon) => {
    if (pokemon.isEgg) {
      return 0;
    }
    const species = await getSpecies(pokemon);
    const growthRate = await species.growthRate();
    const growthRateExperienceLevel = growthRate.levels.find((item) => item.level === pokemon.level);
    return growthRateExperienceLevel ? growthRateExperienceLevel.experience : 0;
  };

  // Experience of the next level of this Pokémon
  const expNextLevel = async (pokemon: Pokemon) => {
    if (pokemon.isEgg) {
      return 0;
    }
    if (pokemon.level === 100) {
      return pokemon.experience;
    }
    const species = await getSpecies(pokemon);
    return species.experience(pokemon.level + 1);
  };

  // When the Pokémon egg will hatch
  const hatchRate = async (pokemon: Pokemon): Promise<HatchRate | null> => {
    if (!pokemon.isEgg || !pokemon.meetDate) {
      return null;
    }
    const species = await getSpecies(pokemon);
    const cycle = Math.ceil((Date.now() - pokemon.meetDate.getTime()) / (3600000 * config.get('app.hatchCycleHour')));
    const cycleLeft = species.pokemonSpecies.hatch_counter - cycle;
    if (cycleLeft <= 0) {
      return 'Hatched';
    } if (cycleLeft <= 5) {
      return 'Soon';
    } if (cycleLeft <= 10) {
      return 'Close';
    }
    return 'Wait';
  };

  const getTrainer = async (pokemon: Pokemon) => database.trainerPokemon
    .findUnique({ where: { pokemonId: pokemon.id } }).trainer();

  // Gain friendship
  const gainHappiness = async (pokemon: Pokemon, happiness: number) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (pokemon.happiness >= 255) {
      return pokemon;
    }

    const [trainer, holdItem, pokeBall] = await Promise.all([
      getTrainer(pokemon),
      getHoldItem(pokemon),
      getPokeBall(pokemon),
    ]);
    const luckySpecies = trainer && await trainerService.luckSpecies(trainer);
    let addHappiness = happiness;
    if (addHappiness > 0 && holdItem && holdItem.name === 'soothe-bell') {
      addHappiness = Math.round(addHappiness * 1.5);
    }
    if (addHappiness > 0 && pokeBall && pokeBall.name === 'luxury-ball') {
      addHappiness *= 2;
    }
    if (addHappiness > 0 && luckySpecies && pokemon.speciesNumber === luckySpecies.pokemonSpecies.id) {
      addHappiness *= 8;
    }
    if (pokemon.happiness + addHappiness > 255) {
      addHappiness = 255 - pokemon.happiness;
    }
    if (pokemon.happiness + addHappiness < 0) {
      addHappiness = -pokemon.happiness;
    }

    return database.pokemon.update({
      where: { id: pokemon.id },
      data: { happiness: pokemon.happiness + addHappiness },
    });
  };

  // Gain experience
  const gainExperience = async (pokemon: Pokemon, experience: number): Promise<Pokemon> => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }

    const species = await getSpecies(pokemon);
    const growthRateExpLevels = keyBy(await species.growthRateExpLevels(), 'level');
    const maxExperience = growthRateExpLevels[100].experience;
    const currentLevel = pokemon.level;
    const currentExperience = pokemon.experience;
    if (currentExperience >= maxExperience) {
      return pokemon;
    }
    const nextExperience = Math.min(pokemon.experience + experience, maxExperience);
    if (nextExperience === currentExperience) {
      return pokemon;
    }
    const nextLevel = range(100, currentLevel - 1, -1)
      .find((level) => experience >= growthRateExpLevels[level].experience)!;

    return await database.pokemon.update({
      where: { id: pokemon.id },
      data: {
        experience: nextExperience,
        level: nextLevel,
      },
    });
  };

  // Level up
  const levelUp = async (pokemon: Pokemon) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }
    if (pokemon.level >= 100) {
      return pokemon;
    }
    const species = await getSpecies(pokemon);

    return database.pokemon.update({
      where: { id: pokemon.id },
      data: {
        experience: await species.experience(pokemon.level + 1),
        level: pokemon.level + 1,
      },
    });
  };

  // Gain HP
  const gainHP = async (pokemon: Pokemon, hp: number) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }
    const stats = await getStats(pokemon);
    const currentHp = stats?.hp ?? 0;
    const addHp = Math.min(-currentHp, Math.max(pokemon.lostHp, hp));
    if (addHp === 0) {
      return pokemon;
    }
    const lostHp = pokemon.lostHp - addHp;
    return database.pokemon.update({
      where: { id: pokemon.id },
      data: { lostHp, pokemonCenter: -addHp === currentHp ? new Date() : null },
    });
  };

  // Gain effort values
  const gainEffort = async (pokemon: Pokemon, effort: PokemonStats) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }
    const nextEffort = pokemon.effort as PokemonStats;
    let currentEffort = Math.max(sum(Object.values(nextEffort)), 510);
    const prevEffort = currentEffort;
    const addEffort = { ...effort };
    Object.keys(statNames).forEach((key) => {
      const type = key as keyof typeof statNames;
      if (!addEffort[type]) {
        return;
      }
      addEffort[type] = Math.min(Math.max(255 - nextEffort[type]!, addEffort[type]!), -nextEffort[type]!);
      nextEffort[type] = nextEffort[type]! + addEffort[type]!;
      currentEffort += addEffort[type]!;
    });
    if (prevEffort === currentEffort) {
      return pokemon;
    }
    return database.pokemon.update({
      where: { id: pokemon.id },
      data: { effort: nextEffort },
    });
  };

  // Change forme
  const changeForme = async (pokemon: Pokemon, formIdentifier: string) => {
    const species = await speciesService.find(pokemon.speciesNumber, formIdentifier);
    return database.pokemon.update({
      where: { id: pokemon.id },
      data: { formIdentifier: species.pokemonForme.form_name },
    });
  };

  // Set hold item
  const setHoldItem = async (pokemon: Pokemon, item: Item) => {
    if (pokemon.isEgg) {
      throw error(ErrorMessage.PokemonIsEgg);
    }
    if (await pokemonCenterTime(pokemon)) {
      throw error(ErrorMessage.PokemonInPC);
    }
    const holdable = item.attributes.some((attribute) => attribute.name === 'holdable');
    if (!holdable) {
      throw error(ErrorMessage.ItemNotHoldable);
    }
    return database.pokemon.update({
      where: { id: pokemon.id },
      data: { holdItemId: item.id },
    });
  };

  return {
    createPokemon,
    displayId,
    getSpecies,
    getNature,
    getPokeBall,
    getHoldItem,
    getStats,
    pokemonCenterTime,
    expCurrentLevel,
    expNextLevel,
    hatchRate,
    getTrainer,
    gainHappiness,
    gainExperience,
    levelUp,
    gainHP,
    gainEffort,
    changeForme,
    setHoldItem,
  };
}

export type PokemonService = ReturnType<typeof pokemonService>;

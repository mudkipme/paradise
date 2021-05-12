import Pokedex, {
  ChainLink, Pokemon, PokemonForm, PokemonSpecies,
} from 'pokedex-promise-v2';

interface SpeciesOptions {
  pokedex: Pokedex;
  pokemonSpecies: PokemonSpecies;
  pokemonForme: PokemonForm;
  pokemon: Pokemon;
}

export const POKEDEX_MAX = 1024;

class Species {
  public readonly pokemonSpecies: PokemonSpecies;

  public readonly pokemonForme: PokemonForm;

  public readonly pokemon: Pokemon;

  #pokedex: Pokedex;

  constructor(options: SpeciesOptions) {
    this.#pokedex = options.pokedex;
    this.pokemonSpecies = options.pokemonSpecies;
    this.pokemonForme = options.pokemonForme;
    this.pokemon = options.pokemon;
  }

  public growthRate() {
    return this.#pokedex.resource(this.pokemonSpecies.growth_rate.url);
  }

  public async growthRateExpLevels() {
    const growthRate = await this.growthRate();
    return growthRate.levels;
  }

  public async experience(level: number) {
    const growthRateExpLevels = await this.growthRateExpLevels();
    const item = growthRateExpLevels.find((entry) => entry.level === level);
    return item ? item.experience : 0;
  }

  public async evolvesTo() {
    const evolutionChain = await this.#pokedex.resource(this.pokemonSpecies.evolution_chain.url);

    const findCurrentChain: (chain: ChainLink) => ChainLink | undefined = (chain: ChainLink) => {
      if (chain.species.name === this.pokemonSpecies.name) {
        return chain;
      }
      for (const nextChain of chain.evolves_to) {
        const found = findCurrentChain(nextChain);
        if (found) {
          return found;
        }
      }
      return undefined;
    };

    const currentChain = findCurrentChain(evolutionChain.chain)!;
    return currentChain.evolves_to;
  }

  public learnMoveDetail(moveName: string, versionGroupName = 'sun-moon') {
    const pokemonMove = this.pokemon.moves.find((entry) => entry.move.name === moveName);
    if (!pokemonMove) {
      return undefined;
    }
    return pokemonMove.version_group_details
      .find((entry) => entry.version_group.name === versionGroupName);
  }
}

export default function speciesService(pokedex: Pokedex) {
  async function find(speciesNumber: number, formIdentifier?: string | null) {
    const pokemonSpecies = await pokedex.getPokemonSpeciesByName(speciesNumber);
    const pokemonFormeName = formIdentifier ? `${pokemonSpecies.name}-${formIdentifier}` : pokemonSpecies.name;
    let pokemonForme: PokemonForm;
    try {
      pokemonForme = await pokedex.getPokemonFormByName(pokemonFormeName);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        pokemonForme = await pokedex.getPokemonFormByName(pokemonSpecies.name);
      } else {
        throw error;
      }
    }
    const pokemon = await pokedex.resource(pokemonForme.pokemon.url);
    const species = new Species({
      pokedex, pokemonSpecies, pokemonForme, pokemon,
    });
    return species;
  }

  async function totalSpecies() {
    const pokemonSpecies = await pokedex.getPokemonSpeciesList();
    return pokemonSpecies.count;
  }

  return {
    find,
    totalSpecies,
  };
}

export type { Species };
export type SpeciesService = ReturnType<typeof speciesService>;

import { ChainLink, Pokemon, PokemonForm, PokemonSpecies } from "pokedex-promise-v2";
import pokedex from "../lib/pokedex";

interface ISpeciesOptions {
    pokemonSpecies: PokemonSpecies;
    pokemonForme: PokemonForm;
    pokemon: Pokemon;
}

export const POKEDEX_MAX = 1024;

export default class Species {
    public static async find(speciesNumber: number, formIdentifier?: string | null) {
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
        const species = new Species({ pokemonSpecies, pokemonForme, pokemon });
        return species;
    }

    public readonly pokemonSpecies: PokemonSpecies;
    public readonly pokemonForme: PokemonForm;
    public readonly pokemon: Pokemon;

    private constructor(options: ISpeciesOptions) {
        this.pokemonSpecies = options.pokemonSpecies;
        this.pokemonForme = options.pokemonForme;
        this.pokemon = options.pokemon;
    }

    public growthRate() {
        return pokedex.resource(this.pokemonSpecies.growth_rate.url);
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
        const evolutionChain = await pokedex.resource(this.pokemonSpecies.evolution_chain.url);

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
        };

        const currentChain = findCurrentChain(evolutionChain.chain)!;
        return currentChain.evolves_to;
    }

    public learnMoveDetail(moveName: string, versionGroupName = "sun-moon") {
        const pokemonMove = this.pokemon.moves.find((entry) => entry.move.name === moveName);
        if (!pokemonMove) {
            return;
        }
        return pokemonMove.version_group_details.find((entry) => entry.version_group.name === versionGroupName);
    }
}

export async function totalSpecies() {
    const pokemonSpecies = await pokedex.getPokemonSpeciesList();
    return pokemonSpecies.count;
}

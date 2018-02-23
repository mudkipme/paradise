import { PokemonSpecies } from "pokedex-promise-v2";
import pokedex from "../lib/pokedex";

interface ISpeciesOptions {
    pokemonSpecies: PokemonSpecies;
}

export default class Species {
    public static async find(speciesNumber: number, formIdentifier?: string | null) {
        const pokemonSpecies = await pokedex.getPokemonSpeciesByName(speciesNumber);
        const species = new Species({ pokemonSpecies });
        return species;
    }

    public readonly pokemonSpecies: PokemonSpecies;

    private constructor(options: ISpeciesOptions) {
        this.pokemonSpecies = options.pokemonSpecies;
    }
}

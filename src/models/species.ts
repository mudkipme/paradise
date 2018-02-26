import { Pokemon, PokemonForm, PokemonSpecies } from "pokedex-promise-v2";
import pokedex from "../lib/pokedex";

interface ISpeciesOptions {
    pokemonSpecies: PokemonSpecies;
    pokemonForme: PokemonForm;
    pokemon: Pokemon;
}

export default class Species {
    public static async find(speciesNumber: number, formIdentifier?: string | null) {
        const pokemonSpecies = await pokedex.getPokemonSpeciesByName(speciesNumber);
        const pokemonFormeName = formIdentifier ? `${pokemonSpecies.name}-${formIdentifier}` : pokemonSpecies.name;
        const pokemonForme = await pokedex.getPokemonFormByName(pokemonFormeName);
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
}

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

    public async experience(level: number) {
        const growthRate = await this.growthRate();
        const growthRateExpLevel = growthRate.levels.find((item) => item.level === level);
        return growthRateExpLevel ? growthRateExpLevel.experience : 0;
    }
}

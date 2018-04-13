import { GraphQLFieldResolver } from "graphql";
import { Context } from "koa";
import { Pokemon } from "../../models";

const PokemonResolver = {
    trainer(pokemon: Pokemon) {
        return pokemon.getTrainer();
    },
    originalTrainer(pokemon: Pokemon) {
        return pokemon.getOriginalTrainer();
    },
    mother(pokemon: Pokemon) {
        return pokemon.getMother();
    },
    father(pokemon: Pokemon) {
        return pokemon.getFather();
    },
};

export default PokemonResolver;

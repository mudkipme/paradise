import createError from "http-errors";

export enum ErrorMessage {
    PokemonIsEgg = "POKEMON_IS_EGG",
    PokemonInPC = "POKEMON_IN_PC",
    ItemNotHoldable = "ITEM_NOT_HOLDABLE",
}

const StatusCodes = {
    [ErrorMessage.PokemonIsEgg]: 403,
    [ErrorMessage.PokemonInPC]: 403,
    [ErrorMessage.ItemNotHoldable]: 400,
};

export default function(message: ErrorMessage) {
    return createError(StatusCodes[message] || 500, message);
}

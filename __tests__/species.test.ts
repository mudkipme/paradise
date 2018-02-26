import nconf from "../src/lib/config";
nconf.set("pokeapi:hostName", "pokeapi.mudkip.me");
import Species from "../src/models/species";

jest.setTimeout(20000);

describe("rakuen.species", () => {
    test("i heard you liek mudkipz", async () => {
        const species = await Species.find(258);
        expect(species.pokemonSpecies.name).toEqual("mudkip");
        expect(species.pokemonForme.name).toEqual("mudkip");
        expect(species.pokemon.name).toEqual("mudkip");
    });
});

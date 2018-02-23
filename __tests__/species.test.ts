import Species from "../src/models/species";

describe("rakuen.species", () => {
    test("i heard you liek mudkipz", async () => {
        const species = await Species.find(258);
        expect(species.pokemonSpecies.name).toEqual("mudkip");
    });
});

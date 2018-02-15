declare module "pokedex-promise-v2" {
    interface NamedAPIResource {
        name: string;
        url: string;
    }

    interface Name {
        name: string;
        language: NamedAPIResource;
    }

    interface APIResource {
        url: string;
    }

    interface ItemSprites {
        default: string;
    }

    interface GenerationGameIndex {
        game_index: number;
        generation: NamedAPIResource;
    }

    interface VersionGroupFlavorText {
        text: string;
        language: NamedAPIResource;
        version_group: NamedAPIResource;
    }

    interface ItemHolderPokemonVersionDetail {
        rarity: string;
        version: NamedAPIResource;
    }

    interface ItemHolderPokemon {
        pokemon: string;
        version_details: ItemHolderPokemonVersionDetail[];
    }

    interface MachineVersionDetail {
        machine: APIResource;
        version_group: NamedAPIResource;
    }

    interface VerboseEffect {
        effect: string;
        short_effect: string;
        language: NamedAPIResource;
    }

    interface NatureStatChange {
        max_change: number;
        pokeathlon_stat: NamedAPIResource;
    }

    interface MoveBattleStylePreference {
        move_battle_style: NamedAPIResource;
        low_hp_preference: number;
        high_hp_preference: number;
    }

    namespace Pokedex {
        interface Nature {
            names: Name[];
            decreased_stat: NamedAPIResource | null;
            move_battle_style_preferences: MoveBattleStylePreference[];
            id: number;
            likes_flavor: NamedAPIResource | null;
            hates_flavor: NamedAPIResource | null;
            pokeathlon_stat_changes: NatureStatChange[];
            increased_stat: NamedAPIResource | null;
            name: string;
        }

        interface Item {
            names: Name[];
            sprites: ItemSprites;
            fling_effect: NamedAPIResource | null;
            id: number;
            fling_power: number | null;
            baby_trigger_for: APIResource | null;
            game_indices: GenerationGameIndex[];
            cost: number;
            flavor_text_entries: VersionGroupFlavorText[];
            held_by_pokemon: ItemHolderPokemon[];
            attributes: NamedAPIResource[];
            category: NamedAPIResource;
            name: string;
            machines: MachineVersionDetail[];
            effect_entries: VerboseEffect[];
        }
    }

    interface PokedexOptions {
        protocol?: "https" | "http";
        hostName?: string;
        versionPath?: string;
        cacheLimit?: number;
        timeout?: number;
    }

    class Pokedex {
        constructor(options?: PokedexOptions);
        resource(path: string): Promise<any>;
        resource(path: string[]): Promise<any[]>;
        getItemByName(nameOrId: string | number): Promise<Pokedex.Item>;
        getNatureByName(nameOrId: string | number): Promise<Pokedex.Nature>;
        getItemsList(): Promise<Pokedex.Item[]>;
        getNaturesList(): Promise<Pokedex.Nature[]>;
    }

    export = Pokedex;
}
import { Item, Nature } from "pokedex-promise-v2";
import { DataTypes, Instance, Model, Sequelize } from "sequelize";
import { Gender, HatchRate } from "../../public/interfaces/pokemon-interface";
import { IImmutableStat, IOptionalStat, IPokemonStat, IStat, statNames } from "../../public/interfaces/stat-interface";
import nconf from "../lib/config";
import { Getters, InstanceMethods, Models } from "../lib/database";
import pokedex from "../lib/pokedex";
import { ITrainerInstance } from "./trainer";

export interface IPokemonAttributes {
    readonly id: string;
    speciesNumber: number;
    formIdentifier: string | null | undefined;
    gender: Gender;
    lostHp: number;
    readonly natureId: number;
    experience: number;
    level: number;
    readonly individual: IImmutableStat;
    effort: IStat;
    isEgg: boolean;
    readonly isShiny: boolean;
    holdItemId: number | null | undefined;
    pokeBallId: number | null | undefined;
    trainer: ITrainerInstance | null | undefined;
    happiness: number;
    nickname: string | null | undefined;
    originalTrainer: ITrainerInstance | null | undefined;
    displayOT: string | null | undefined;
    meetLevel: number | null | undefined;
    meetPlaceIndex: string | null | undefined;
    meetDate: Date | null | undefined;
    birthDate: Date | null | undefined;
    mother: IPokemonInstance | null | undefined;
    father: IPokemonInstance | null | undefined;
    tradable: boolean;
    pokemonCenter: Date | null | undefined;
}

export interface IPokemonVirtuals {
    displayId: string;
}

export interface IPokemonInstanceMethods {
    pokemonCenterTime(): Promise<number>;
    nature(): Promise<Nature>;
    pokeBall(): Promise<Item | null>;
    holdItem(): Promise<Item | null>;
    stats(): Promise<IPokemonStat | null>;
    expCurrentLevel(): Promise<number>;
    expNextLevel(): Promise<number>;
    hatchRate(): Promise<HatchRate | null>;
    gainHappiness(happiness: number): Promise<this>;
    gainExperience(exp: number): Promise<this>;
    levelUp(): Promise<this>;
}

export interface IPokemonInstance extends Instance<IPokemonAttributes>,
    IPokemonAttributes, IPokemonVirtuals, InstanceMethods<IPokemonInstanceMethods, IPokemonInstance> { }

export default function pokemon(sequelize: Sequelize, dataTypes: DataTypes) {
    const getterMethods: Getters<IPokemonVirtuals, IPokemonInstance> = {
        // Shorter ID String
        displayId() {
            return this.id.substr(-6);
        },
    };

    const instanceMethods: InstanceMethods<IPokemonInstanceMethods, IPokemonInstance> = {
        // Caculate the rest time in Pokémon Center
        async pokemonCenterTime() {
            return 0;
        },

        // Get the Nature of this Pokémon, return a Promise object
        nature() {
            return pokedex.getNatureByName(this.natureId);
        },

        // Get the Poké Ball of this Pokémon, return a Promise object
        pokeBall() {
            if (!this.pokeBallId) {
                return Promise.resolve(null);
            }
            return pokedex.getItemByName(this.pokeBallId);
        },

        // Get the hold item of this Pokémon, return a Promise object
        holdItem() {
            if (!this.holdItemId) {
                return Promise.resolve(null);
            }
            return pokedex.getItemByName(this.holdItemId);
        },

        // Pokémon Stats, return a Promise object
        async stats() {
            return null;
        },

        // Experience of the current level of this Pokémon
        async expCurrentLevel() {
            return 0;
        },

        // Experience of the next level of this Pokémon
        async expNextLevel() {
            return 0;
        },

        // When the Pokémon egg will hatch
        async hatchRate() {
            return null;
        },

        // Gain friendship
        async gainHappiness() {
            return this;
        },

        // Gain experience
        async gainExperience() {
            return this;
        },

        // Level up
        async levelUp() {
            return this;
        },
    };

    const Pokemon = sequelize.define<IPokemonInstance, IPokemonAttributes>("pokemon", {
        displayOT: { type: dataTypes.STRING },
        effort: { type: dataTypes.JSONB, allowNull: false },
        experience: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        formIdentifier: { type: dataTypes.STRING },
        gender: { type: dataTypes.BOOLEAN, allowNull: false },
        happiness: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        holdItemId: { type: dataTypes.INTEGER },
        id: { type: dataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: dataTypes.UUIDV4 },
        individual: { type: dataTypes.JSONB, allowNull: false },
        isEgg: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        isShiny: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        level: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        lostHp: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        meetDate: { type: dataTypes.DATE },
        meetLevel: { type: dataTypes.INTEGER },
        meetPlaceIndex: { type: dataTypes.STRING },
        natureId: { type: dataTypes.INTEGER, allowNull: false },
        nickname: { type: dataTypes.STRING },
        pokeBallId: { type: dataTypes.INTEGER },
        pokemonCenter: { type: dataTypes.DATE },
        speciesNumber: { type: dataTypes.INTEGER, allowNull: false },
        tradable: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        getterMethods,
        instanceMethods,
    });

    Pokemon.belongsTo(Pokemon, { as: "mother" });
    Pokemon.belongsTo(Pokemon, { as: "father" });

    return Pokemon;
}

export function setupRelation({ Pokemon, Trainer }: Models, sequelize: Sequelize, dataTypes: DataTypes) {
    Pokemon.belongsTo(Trainer, { as: "trainer" });
    Pokemon.belongsTo(Trainer, { as: "originalTrainer" });
}

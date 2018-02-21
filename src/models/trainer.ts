import { DataTypes, Instance, Model, Sequelize } from "sequelize";
import { BattleResult } from "../../public/interfaces/battle-interface";
import { IProfile } from "../../public/interfaces/profile-interface";
import { Models } from "../lib/database";
import { IPokemonInstance } from "./pokemon";

export interface ITrainerAttributes {
    id: string;
    name: string;
    pokedexHex: {
        caught: string;
        seen: string;
        formM: string;
        formF: string;
        formMS: string;
        formFS: string;
    };
    pokedexCaughtNum: number;
    pokedexSeenNum: number;
    party: IPokemonInstance[];
    storage: Array<{
        name: string;
        wallpaper: string;
    }>;
    currentBox: number;
    storagePokemon: Array<{
        boxId: number;
        position: number;
        pokemon: IPokemonInstance
    }>;
    bag: Array<{
        itemId: number;
        number: number;
    }>;
    encounter: {
        location: string;
        area: string;
        method: string;
        battleResult: BattleResult;
    } | null;
    encounterPokemon: IPokemonInstance | null;
    battlePokemon: IPokemonInstance | null;
    realworld: {
        longitude: number;
        latitude: number;
        countryCode: string;
        timezoneId: string;
    };
    language: string;
    acceptBattle: boolean;
    statistics: {
        battleTime: number;
        battleWin: number;
        tradeTime: number;
        catchTime: number;
        hatchTime: number;
        evolveTime: number;
        cost: number;
    };
    lastLogin: Date;
    todayLuck: number | null;
    battlePoint: number;
    profile: IProfile;
}

export interface ITrainerInstance extends Instance<ITrainerAttributes>, ITrainerAttributes {

}

export default function trainer(sequelize: Sequelize, dataTypes: DataTypes) {
    const Trainer = sequelize.define<ITrainerInstance, ITrainerAttributes>("trainer", {
        acceptBattle: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        bag: { type: dataTypes.JSONB, allowNull: false, defaultValue: [] },
        battlePoint: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        currentBox: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        encounter: { type: dataTypes.JSONB },
        id: { type: dataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: dataTypes.UUIDV4 },
        language: { type: dataTypes.STRING },
        lastLogin: { type: dataTypes.DATE, allowNull: false },
        name: { type: dataTypes.STRING, allowNull: false },
        pokedexCaughtNum: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        pokedexHex: {
            allowNull: false,
            defaultValue: {
                caught: "",
                formF: "",
                formFS: "",
                formM: "",
                formMS: "",
                seen: "",
            },
            type: dataTypes.JSONB,
        },
        pokedexSeenNum: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        profile: { type: dataTypes.JSONB, allowNull: false },
        realworld: {
            allowNull: false,
            defaultValue: {
                countryCode: "",
                latitude: 0,
                longitude: 0,
                timezoneId: "",
            },
            type: dataTypes.JSONB,
        },
        statistics: {
            allowNull: false,
            defaultValue: {
                battleTime: 0,
                battleWin: 0,
                catchTime: 0,
                cost: 0,
                evolveTime: 0,
                hatchTime: 0,
                tradeTime: 0,
            },
            type: dataTypes.JSONB,
        },
        storage: { type: dataTypes.JSONB, allowNull: false, defaultValue: [] },
        todayLuck: { type: dataTypes.INTEGER },
    }, {
        indexes: [
            {
                fields: ["name"],
                unique: true,
            },
            {
                fields: ["profile"],
                operator: "jsonb_path_ops",
                using: "gin",
            },
            {
                fields: ["statistics"],
                operator: "jsonb_path_ops",
                using: "gin",
            },
        ],
    });

    return Trainer;
}

export function setupRelation({ Pokemon, Trainer }: Models, sequelize: Sequelize, dataTypes: DataTypes) {
    const TrainerParty = sequelize.define("trainerParty", {
        position: dataTypes.INTEGER,
    });
    Trainer.belongsToMany(Pokemon, { as: "party", through: TrainerParty });

    const TrainerStorage = sequelize.define("trainerStorage", {
        boxId: dataTypes.INTEGER,
        position: dataTypes.INTEGER,
    });
    Trainer.belongsToMany(Pokemon, { as: "storagePokemon", through: TrainerStorage });

    Trainer.belongsTo(Pokemon, { as: "encounterPokemon", constraints: false });
    Trainer.belongsTo(Pokemon, { as: "battlePokemon", constraints: false });
}

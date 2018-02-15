import { DataTypes, Instance, Model, Sequelize } from "sequelize";
import { BattleResult } from "../../public/interfaces/battle-interface";
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
    storagePokemon: {
        boxId: number;
        position: number;
        pokemon: IPokemonInstance
    } | null | undefined;
    bag: Array<{
        itemId: number;
        number: number;
    }>;
    encounter: {
        location: string | null | undefined;
        area: string | null | undefined;
        method: string | null | undefined;
        battleResult: BattleResult | null | undefined;
    };
    encounterPokemon: IPokemonInstance | null | undefined;
    battlePokemon: IPokemonInstance | null | undefined;
    realworld: {
        longitude: number | null | undefined;
        latitude: number | null | undefined;
        countryCode: string | null | undefined;
        timezoneId: string | null | undefined;
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
    };
    lastLogin: Date;
    todayLuck: number | null | undefined;
    battlePoint: number;
}

export interface ITrainerInstance extends Instance<ITrainerAttributes> {

}

export default function trainer(sequelize: Sequelize, dataTypes: DataTypes) {
    const Trainer = sequelize.define<ITrainerInstance, ITrainerAttributes>("trainer", {
        acceptBattle: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        bag: { type: dataTypes.JSONB, allowNull: false },
        battlePoint: { type: dataTypes.INTEGER },
        currentBox: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        encounter: { type: dataTypes.JSONB, allowNull: false },
        id: { type: dataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: dataTypes.UUIDV4 },
        language: { type: dataTypes.STRING },
        lastLogin: { type: dataTypes.DATE, allowNull: false },
        name: { type: dataTypes.STRING, allowNull: false },
        pokedexCaughtNum: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        pokedexHex: { type: dataTypes.JSONB, allowNull: false },
        pokedexSeenNum: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        realworld: { type: dataTypes.JSONB, allowNull: false },
        statistics: { type: dataTypes.JSONB, allowNull: false },
        storage: { type: dataTypes.JSONB, allowNull: false },
        todayLuck: { type: dataTypes.INTEGER },
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

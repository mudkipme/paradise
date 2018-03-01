import { DataTypes, Model, ModelIndexesOptions, Sequelize } from "sequelize";
import { BattleResult } from "../../public/interfaces/battle-interface";
import { IProfile, ITrainerPrivate, ITrainerPublic, TimeOfDay } from "../../public/interfaces/trainer-interface";
import { sequelize } from "../lib/database";
import Pokemon from "./pokemon";

interface ITrainerParty {
    position: number;
    pokemon: Pokemon;
}

export default class Trainer extends Model {
    public id: string;
    public name: string;
    public pokedexHex: {
        caught: string;
        seen: string;
        formM: string;
        formF: string;
        formMS: string;
        formFS: string;
    };
    public pokedexCaughtNum: number;
    public pokedexSeenNum: number;
    public getParty: () => Promise<ITrainerParty[]>;
    public storage: Array<{
        name: string;
        wallpaper: string;
    }>;
    public currentBox: number;
    public storagePokemon: Array<{
        boxId: number;
        position: number;
        pokemon: Pokemon
    }>;
    public bag: Array<{
        itemId: number;
        number: number;
    }>;
    public encounter: {
        location: string;
        area: string;
        method: string;
        battleResult: BattleResult;
    } | null;
    public encounterPokemon: Pokemon | null;
    public battlePokemon: Pokemon | null;
    public realworld: {
        longitude: number;
        latitude: number;
        countryCode: string;
        timezoneId: string;
    };
    public language: string;
    public acceptBattle: boolean;
    public statistics: {
        battleTime: number;
        battleWin: number;
        tradeTime: number;
        catchTime: number;
        hatchTime: number;
        evolveTime: number;
        cost: number;
    };
    public lastLogin: Date;
    public todayLuck: number | null;
    public battlePoint: number;
    public profile: IProfile;

    // Virtual attributes
    public readonly timeOfDay: TimeOfDay;

    public serializePrivate() {
        return {
            ...this.serializePublic(),
            battlePokemon: this.battlePokemon && this.battlePokemon.id,
            encounter: this.encounter,
            encounterPokemon: this.encounterPokemon && this.encounterPokemon.id,
            language: this.language,
            profile: this.profile,
            realworld: this.realworld,
        };
    }

    public serializePublic() {
        return {
            acceptBattle: this.acceptBattle,
            battlePoint: this.battlePoint,
            id: this.id,
            lastLogin: this.lastLogin,
            name: this.name,
            pokedexCaughtNum: this.pokedexCaughtNum,
            pokedexSeenNum: this.pokedexSeenNum,
            statistics: this.statistics,
            todayLuck: this.todayLuck,
        };
    }
}

Trainer.init({
    acceptBattle: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    bag: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    battlePoint: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    currentBox: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    encounter: { type: DataTypes.JSONB },
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    language: { type: DataTypes.STRING },
    lastLogin: { type: DataTypes.DATE, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    pokedexCaughtNum: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
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
        type: DataTypes.JSONB,
    },
    pokedexSeenNum: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    profile: { type: DataTypes.JSONB, allowNull: false },
    realworld: {
        allowNull: false,
        defaultValue: {
            countryCode: "",
            latitude: 0,
            longitude: 0,
            timezoneId: "",
        },
        type: DataTypes.JSONB,
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
        type: DataTypes.JSONB,
    },
    storage: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    todayLuck: { type: DataTypes.INTEGER },
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
    ] as ModelIndexesOptions[],
    sequelize,
});

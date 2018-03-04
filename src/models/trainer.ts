import { random } from "lodash";
import moment from "moment";
import "moment-timezone";
import { Item } from "pokedex-promise-v2";
import { DataTypes, FindOptions, Model, ModelIndexesOptions, Sequelize } from "sequelize";
import SunCalc from "suncalc";
import { promisify } from "util";
import { BattleResult } from "../../public/interfaces/battle-interface";
import { IProfile, ITrainerPrivate, ITrainerPublic, TimeOfDay } from "../../public/interfaces/trainer-interface";
import { sequelize } from "../lib/database";
import createError, { ErrorMessage } from "../lib/error";
import { geode } from "../lib/geo";
import Pokemon from "./pokemon";
import Species, { totalSpecies } from "./species";

interface ITrainerParty {
    position: number;
    pokemon: Pokemon;
}

interface ITrainerStoragePokemon {
    boxId: number;
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
    public getStoragePokemon: (options?: FindOptions) => Promise<ITrainerStoragePokemon[]>;
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
    public getEncounterPokemon: () => Promise<Pokemon | null>;
    public getBattlePokemon: () => Promise<Pokemon | null>;
    public realWorld: {
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
    public battlePoint: number;
    public profile: IProfile;
    // Virtual attributes
    public readonly timeOfDay: TimeOfDay;
    // Private attributes
    private todayLuck: number | null;

    // Get current time of day
    public localTime() {
        return moment().tz(this.realWorld.timezoneId);
    }

    // Get today's lucky Pokémon
    public async luckSpecies() {
        const lastLogin = moment(this.lastLogin).tz(this.realWorld.timezoneId);
        const now = moment().tz(this.realWorld.timezoneId);

        if (now.isSame(lastLogin, "day") && this.todayLuck) {
            return Species.find(this.todayLuck);
        }

        this.lastLogin = new Date();
        this.todayLuck = random(1, await totalSpecies());
        await this.save();
        return Species.find(this.todayLuck);
    }

    /**
     * Set real world location based on latitude and longitude
     * @param  {number}   latitude
     * @param  {number}   longitude
     */
    public async setLocation(latitude: number, longitude: number) {
        const tz = await geode.timezone({ lat: latitude, lng: longitude });
        if (tz.status) {
            throw new Error(tz.status.message);
        }
        this.realWorld.latitude = latitude;
        this.realWorld.longitude = longitude;
        this.realWorld.timezoneId = tz.timezoneId;
        this.realWorld.countryCode = tz.countryCode;
        await this.save();
    }

    /**
     * Check whether this trainer has certain item in bag
     */
    public itemNumber(item: Item) {
        const itemBag = this.bag.find((entry) => entry.itemId === item.id);
        return itemBag ? itemBag.number : 0;
    }

    /**
     * Add an item to bag
     * @param  {Item}   item
     * @param  {number}   number
     */
    public async addItem(item: Item, count = 1) {
        const itemBag = this.bag.find((entry) => entry.itemId === item.id);
        if (!itemBag) {
            this.bag.push({ itemId: item.id, number: count });
        } else {
            itemBag.number += count;
        }
        await this.save();
    }

    /**
     * Remove an item from bag
     * @param  {Item}   item
     * @param  {Number}   number
     */
    public async removeItem(item: Item, count = 1) {
        const itemBag = this.bag.find((entry) => entry.itemId === item.id);
        if (!itemBag || itemBag.number < count) {
            throw createError(ErrorMessage.ItemNotEnough);
        }
        itemBag.number -= count;
        this.bag = this.bag.filter((bag) => bag.number > 0);
        await this.save();
    }

    public serializePrivate() {
        return {
            ...this.serializePublic(),
            encounter: this.encounter,
            language: this.language,
            profile: this.profile,
            realWorld: this.realWorld,
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
    realWorld: {
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

import BitArray from "bit-array";
import { random, range } from "lodash";
import moment from "moment-timezone";
import { Item, Location } from "pokedex-promise-v2";
import {
    BelongsToGetAssociationMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyGetAssociationsMixin,
    DataTypes,
    FindOptions,
    Model,
    ModelIndexesOptions,
    Sequelize,
} from "sequelize";
import SunCalc from "suncalc";
import { promisify } from "util";
import { BattleResult } from "../../public/interfaces/battle-interface";
import { Gender, IPokemon } from "../../public/interfaces/pokemon-interface";
import { IProfile, TimeOfDay } from "../../public/interfaces/trainer-interface";
import nconf from "../lib/config";
import { sequelize } from "../lib/database";
import createError, { ErrorMessage } from "../lib/error";
import { geode } from "../lib/geo";
import Pokemon from "./pokemon";
import Species, { POKEDEX_MAX, totalSpecies } from "./species";

interface ITrainerParty {
    position: number;
    pokemon: Pokemon;
}

interface ITrainerStoragePokemon {
    boxId: number;
    position: number;
    pokemon: Pokemon;
}

type IPokemonSlot = {
    party: true;
    position: number;
} | {
    boxId: number;
    position: number;
};

export default class Trainer extends Model {
    public id: string;
    public name: string;
    public pokedexHex: {
        caught: string;
        seen: string;
        seenM: string;
        seenF: string;
        seenMS: string;
        seenFS: string;
        formM: string;
        formF: string;
        formMS: string;
        formFS: string;
    };
    public pokedexCaughtNum: number;
    public pokedexSeenNum: number;
    public getParty: BelongsToManyGetAssociationsMixin<ITrainerParty>;
    public storage: Array<{
        name: string;
        wallpaper: string;
    }>;
    public currentBox: number;
    public getStoragePokemon: BelongsToManyGetAssociationsMixin<ITrainerStoragePokemon>;
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
    public getEncounterPokemon: BelongsToGetAssociationMixin<Pokemon>;
    public getBattlePokemon: BelongsToGetAssociationMixin<Pokemon>;
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
    // Private attributes
    private todayLuck: number | null;
    private addParty: BelongsToManyAddAssociationMixin<ITrainerParty, string>;
    private addStoragePokemon: BelongsToManyAddAssociationMixin<ITrainerStoragePokemon, string>;

    public get storageNum() {
        return Math.max(this.storage.length, 8);
    }

    public get timeOfDay() {
        if (this.realWorld.longitude || this.realWorld.latitude) {
            const times = SunCalc.getTimes(new Date(), this.realWorld.latitude, this.realWorld.longitude);
            const now = Date.now();
            if (now >= times.dawn.getTime() && now <= times.sunriseEnd.getTime()) {
                return "morning";
            } else if (now > times.sunriseEnd.getTime() && now < times.sunsetStart.getTime()) {
                return "day";
            } else if (now >= times.sunsetStart.getTime() && now <= times.nauticalDusk.getTime()) {
                return "evening";
            }
            return "night";
        }
        const hours = this.localTime().hours();
        if (hours >= 6 && hours <= 9) {
            return "morning";
        } else if (hours >= 10 && hours <= 16) {
            return "day";
        } else if (hours === 17) {
            return "evening";
        }
        return "night";
    }

    // Get current time of day
    public localTime() {
        return moment().tz(this.realWorld.timezoneId);
    }

    // Get today's lucky Pokémon
    public async luckSpecies() {
        const lastLogin = moment(this.lastLogin).tz(this.realWorld.timezoneId);
        const now = this.localTime();

        if (now.isSame(lastLogin, "day") && this.todayLuck) {
            return Species.find(this.todayLuck);
        }

        this.lastLogin = new Date();
        this.todayLuck = random(1, await totalSpecies());
        await this.save();
        return Species.find(this.todayLuck);
    }

    public async setPokemonSeen(pokemon: Pokemon) {
        if (pokemon.isEgg) {
            return;
        }
        const seen = new BitArray(POKEDEX_MAX, this.pokedexHex.seen);
        seen.set(pokemon.speciesNumber, true);
        this.pokedexHex.seen = seen.toHexString();
        this.pokedexSeenNum = seen.count();

        const hex = this.pokedexHex;
        let dexKey: keyof typeof hex;
        if (pokemon.formIdentifier && pokemon.isShiny && pokemon.gender === Gender.Female) {
            dexKey = "formFS";
        } else if (pokemon.formIdentifier && pokemon.isShiny) {
            dexKey = "formMS";
        } else if (pokemon.formIdentifier && pokemon.gender === Gender.Female) {
            dexKey = "formF";
        } else if (pokemon.formIdentifier) {
            dexKey = "formM";
        } else if (pokemon.isShiny && pokemon.gender === Gender.Female) {
            dexKey = "seenFS";
        } else if (pokemon.isShiny) {
            dexKey = "seenMS";
        } else if (pokemon.gender === Gender.Female) {
            dexKey = "seenF";
        } else {
            dexKey = "seenM";
        }

        const dex = new BitArray(POKEDEX_MAX, hex[dexKey]);
        if (pokemon.formIdentifier) {
            const species = await pokemon.species();
            dex.set(species.pokemonForme.id % 10000, true);
        } else {
            dex.set(pokemon.speciesNumber, true);
        }
        hex[dexKey] = dex.toHexString();

        await this.save();
    }

    public async setPokedexCaught(pokemon: Pokemon) {
        await this.setPokemonSeen(pokemon);
        const caught = new BitArray(POKEDEX_MAX, this.pokedexHex.caught);
        caught.set(pokemon.speciesNumber, true);
        this.pokedexHex.caught = caught.toHexString();
        this.pokedexCaughtNum = caught.count();
        await this.save();
    }

    public hasCaught(speciesNumber: number) {
        const caught = new BitArray(POKEDEX_MAX, this.pokedexHex.caught);
        return caught.get(speciesNumber);
    }

    /**
     * Find an empty slot in storage
     */
    public async storageSlot() {
        const storagePokemon = await this.getStoragePokemon();
        let box: ITrainerStoragePokemon[] = [];

        // the indexes of all boxes from currentBox
        let boxId = range(this.currentBox, this.currentBox + this.storageNum)
            .map((index) => (index % this.storageNum))
            .find((id) => {
                // find the box which has empty slot
                const currentBox = storagePokemon.filter((sp) => sp.boxId === id);
                if (currentBox.length >= 30) {
                    return false;
                }
                box = currentBox;
                return true;
            });

        // add a box when there's no empty slot
        if (typeof boxId === "undefined") {
            boxId = this.storageNum;
            this.storage[boxId] = { name: "", wallpaper: "" };
        }

        // find an empty slot in the box
        const position = range(0, 30).find((pos) => {
            return typeof box.find((sp) => sp.position === pos) === "undefined";
        })!;

        this.currentBox = boxId;
        await this.save();

        return {
            boxId,
            position,
        };
    }

    /**
     * Catch a Pokémon
     * @param  {Pokemon}   pokemon  The Pokémon to be caught
     * @param  {Item}      pokeBall The Poké Ball to use
     * @param  {Location}  location The location where the Pokémon was encountered
     */
    public async catchPokemon(pokemon: Pokemon, pokeBall: Item, location: Location) {
        const [party, species, originalTrainer] = await Promise.all([
            this.getParty(), pokemon.species(), pokemon.getOriginalTrainer(),
        ]);
        let slot: IPokemonSlot;
        if (party.length < 6) {
            slot = {
                party: true,
                position: Math.max(...party.map((tp) => tp.position)) + 1,
            };
            await this.addParty({
                pokemon,
                position: slot.position,
            });
        } else {
            slot = await this.storageSlot();
            await this.addStoragePokemon({
                ...slot,
                pokemon,
            });
        }

        await pokemon.setTrainer(this);
        if (!originalTrainer) {
            await pokemon.setOriginalTrainer(this);
        }
        await this.setPokedexCaught(pokemon);
        pokemon.happiness = species.pokemonSpecies.base_happiness;
        pokemon.pokeBallId = pokeBall.id;
        pokemon.meetDate = new Date();
        pokemon.meetLevel = pokemon.level;
        pokemon.meetPlaceIndex = location.name;
        this.statistics.catchTime += 1;
        await Promise.all([pokemon.save(), this.save()]);
        return slot;
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
     * Get the position of given Pokémon
     * @param  {Pokemon} pokemon
     */
    public async findPokemon(pokemon: Pokemon): Promise<IPokemonSlot | null> {
        const party = await this.getParty({ where: { pokemon_id: pokemon.id }});
        if (party.length > 0) {
            return {
                party: true,
                position: party[0].position,
            };
        }
        const sp = await this.getStoragePokemon({ where: { pokemon_id: pokemon.id }});
        if (sp.length > 0) {
            return {
                boxId: sp[0].boxId,
                position: sp[0].position,
            };
        }
        return null;
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
            seenF: "",
            seenFS: "",
            seenM: "",
            seenMS: "",
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
            timezoneId: nconf.get("app:defaultTimezone"),
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

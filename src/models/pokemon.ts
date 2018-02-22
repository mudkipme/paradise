import { Item, Nature } from "pokedex-promise-v2";
import { DataTypes, Model, Sequelize } from "sequelize";
import { Gender, HatchRate } from "../../public/interfaces/pokemon-interface";
import { IImmutableStat, IOptionalStat, IPokemonStat, IStat, StatName } from "../../public/interfaces/stat-interface";
import nconf from "../lib/config";
import { sequelize } from "../lib/database";
import pokedex from "../lib/pokedex";
import Trainer from "./trainer";

export default class Pokemon extends Model {
    public readonly id: string;
    public speciesNumber: number;
    public formIdentifier: string | null;
    public gender: Gender;
    public lostHp: number;
    public readonly natureId: number;
    public experience: number;
    public level: number;
    public readonly individual: IImmutableStat;
    public effort: IStat;
    public isEgg: boolean;
    public readonly isShiny: boolean;
    public holdItemId: number | null;
    public pokeBallId: number | null;
    public trainer: Trainer | null;
    public happiness: number;
    public nickname: string | null;
    public originalTrainer: Trainer | null;
    public displayOT: string | null;
    public meetLevel: number | null;
    public meetPlaceIndex: string | null;
    public meetDate: Date | null;
    public birthDate: Date | null;
    public mother: Pokemon | null;
    public father: Pokemon | null;
    public tradable: boolean;
    public pokemonCenter: Date | null | undefined;
    public displayId: string;

    // Caculate the rest time in Pokémon Center
    public async pokemonCenterTime() {
        return 0;
    }

    // Get the Nature of this Pokémon, return a Promise object
    public nature() {
        return pokedex.getNatureByName(this.natureId);
    }

    // Get the Poké Ball of this Pokémon, return a Promise object
    public pokeBall() {
        if (!this.pokeBallId) {
            return Promise.resolve(null);
        }
        return pokedex.getItemByName(this.pokeBallId);
    }

    // Get the hold item of this Pokémon, return a Promise object
    public holdItem() {
        if (!this.holdItemId) {
            return Promise.resolve(null);
        }
        return pokedex.getItemByName(this.holdItemId);
    }

    // Pokémon Stats, return a Promise object
    public async stats() {
        return null;
    }

    // Experience of the current level of this Pokémon
    public async expCurrentLevel() {
        return 0;
    }

    // Experience of the next level of this Pokémon
    public async expNextLevel() {
        return 0;
    }

    // When the Pokémon egg will hatch
    public async hatchRate() {
        return null;
    }

    // Gain friendship
    public async gainHappiness() {
        return this;
    }

    // Gain experience
    public async gainExperience() {
        return this;
    }

    // Level up
    public async levelUp() {
        return this;
    }
}

Pokemon.init({
    displayId: {
        allowNull: false,
        type: DataTypes.STRING,
        get(this: Pokemon) {
            return this.getDataValue("id").substr(-6);
        },
    },
    displayOT: { type: DataTypes.STRING },
    effort: { type: DataTypes.JSONB, allowNull: false },
    experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    formIdentifier: { type: DataTypes.STRING },
    gender: { type: DataTypes.BOOLEAN, allowNull: false },
    happiness: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    holdItemId: { type: DataTypes.INTEGER },
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    individual: { type: DataTypes.JSONB, allowNull: false },
    isEgg: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isShiny: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    lostHp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    meetDate: { type: DataTypes.DATE },
    meetLevel: { type: DataTypes.INTEGER },
    meetPlaceIndex: { type: DataTypes.STRING },
    natureId: { type: DataTypes.INTEGER, allowNull: false },
    nickname: { type: DataTypes.STRING },
    pokeBallId: { type: DataTypes.INTEGER },
    pokemonCenter: { type: DataTypes.DATE },
    speciesNumber: { type: DataTypes.INTEGER, allowNull: false },
    tradable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    sequelize,
});

Pokemon.belongsTo(Pokemon, { as: "mother" });
Pokemon.belongsTo(Pokemon, { as: "father" });

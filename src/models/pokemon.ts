import { keyBy } from "lodash";
import { Item, Nature } from "pokedex-promise-v2";
import { DataTypes, Model, Sequelize } from "sequelize";
import { Gender, HatchRate } from "../../public/interfaces/pokemon-interface";
import { IImmutableStat, IOptionalStat, IPokemonStat, IStat, StatName } from "../../public/interfaces/stat-interface";
import nconf from "../lib/config";
import { sequelize } from "../lib/database";
import pokedex from "../lib/pokedex";
import Species from "./species";
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
    // Virtual attributes
    public readonly displayId: string;
    public readonly pokemonCenterTime: number;

    // Get the Species of this Pokémon
    public species() {
        return Species.find(this.speciesNumber, this.formIdentifier);
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
        if (this.isEgg) {
            return null;
        }
        const [species, nature] = await Promise.all([this.species(), this.nature()]);
        const stats = keyBy(species.pokemon.stats, "stat.name");
        const result: Partial<IPokemonStat> = {};
        let lostHp = this.lostHp;

        result.maxHp = Math.round((this.individual.hp + 2 * stats.hp.base_stat + this.effort.hp
            / 4 + 100) * this.level / 100 + 10);

        if (this.pokemonCenter) {
            lostHp -= Math.floor((Date.now() - this.pokemonCenter.getTime()) / 36e5 * nconf.get("app:pokemonCenterHP"));
        }

        lostHp = Math.max(Math.min(lostHp, result.maxHp), 0);
        result.hp = result.maxHp - lostHp;

        Object.values(StatName).forEach((type: StatName) => {
            let multiplier = 1;
            if (nature.decreased_stat.name === type) {
                multiplier = 0.9;
            }
            if (nature.increased_stat.name === type) {
                multiplier = 1.1;
            }
            result[type] = Math.round(((this.individual[type] + 2 * stats[type].base_stat + this.effort[type] / 4)
                * this.level / 100 + 5) * multiplier);
        });
        return result as Readonly<IPokemonStat>;
    }

    // Experience of the current level of this Pokémon
    public async expCurrentLevel() {
        if (this.isEgg) {
            return 0;
        }
        const species = await this.species();
        const growthRate = await species.growthRate();
        const growthRateExperienceLevel = growthRate.levels.find((item) => item.level === this.level);
        return growthRateExperienceLevel ? growthRateExperienceLevel.experience : 0;
    }

    // Experience of the next level of this Pokémon
    public async expNextLevel() {
        if (this.isEgg) {
            return 0;
        }
        if (this.level === 100) {
            return this.experience;
        }
        const species = await this.species();
        return species.experience(this.level + 1);
    }

    // When the Pokémon egg will hatch
    public async hatchRate() {
        if (!this.isEgg || !this.meetDate) {
            return null;
        }
        const species = await this.species();
        const cycle = Math.ceil((Date.now() - this.meetDate.getTime()) / (3600000 * nconf.get("app:hatchCycleHour")));
        const cycleLeft = species.pokemonSpecies.hatch_counter - cycle;
        if (cycleLeft <= 0) {
            return HatchRate.Hatched;
        } else if (cycleLeft <= 5) {
            return HatchRate.Soon;
        } else if (cycleLeft <= 10) {
            return HatchRate.Close;
        } else {
            return HatchRate.Wait;
        }
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
    // Shorter ID String
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
    // Caculate the rest time in Pokémon Center
    pokemonCenterTime: {
        allowNull: false,
        type: DataTypes.INTEGER,
        get(this: Pokemon) {
            if (!this.pokemonCenter) {
                return 0;
            }

            const time = this.lostHp / nconf.get("app:pokemonCenterHP") * 36e5
                + this.pokemonCenter.getTime() - Date.now();

            return Math.ceil(Math.max(time, 0));
        },
    },
    speciesNumber: { type: DataTypes.INTEGER, allowNull: false },
    tradable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    sequelize,
});

Pokemon.belongsTo(Pokemon, { as: "mother" });
Pokemon.belongsTo(Pokemon, { as: "father" });

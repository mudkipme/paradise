import { extend, keyBy, pickBy, random, range, sum, times, zipObject } from "lodash";
import { Item, Nature } from "pokedex-promise-v2";
import { DataTypes, Model, Sequelize } from "sequelize";
import { Gender, HatchRate } from "../../public/interfaces/pokemon-interface";
import { IPokemonStat, IStat, StatName } from "../../public/interfaces/stat-interface";
import nconf from "../lib/config";
import { sequelize } from "../lib/database";
import createError, { ErrorMessage } from "../lib/error";
import { findEvolution, IEvolveOptions } from "../lib/evolution";
import pokedex from "../lib/pokedex";
import Species from "./species";
import Trainer from "./trainer";

interface IPokemonCreateOptions {
    speciesNumber: number;
    formIdentifier?: string;
    isEgg?: boolean;
    level?: number;
    gender?: Gender;
    nature?: Nature;
    individual?: Partial<IStat>;
    effort?: Partial<IStat>;
    isShiny?: boolean;
    happiness?: number;
    originalTrainer?: Trainer;
    displayOT?: string;
    birthDate?: Date;
    father?: Pokemon;
    mother?: Pokemon;
    holdItem?: Item;
}

const NATURE_COUNT = 25;

export default class Pokemon extends Model {
    public static async createPokemon(options: IPokemonCreateOptions) {
        const species = await Species.find(options.speciesNumber, options.formIdentifier);
        const level = options.isEgg ? 1 : (options.level || 5);
        const experience = await species.experience(level);

        // Gender
        let gender: Gender;
        if (species.pokemonSpecies.gender_rate === -1) {
            gender = Gender.Genderless;
        } else if (species.pokemonSpecies.gender_rate === 0) {
            gender = Gender.Male;
        } else if (species.pokemonSpecies.gender_rate === 8) {
            gender = Gender.Female;
        } else if (options.gender) {
            gender = options.gender;
        } else {
            gender = random(0, 7) < species.pokemonSpecies.gender_rate ? Gender.Female : Gender.Male;
        }

        // Nature
        const natureId = options.nature ? options.nature.id : random(1, NATURE_COUNT);

        // Species stats and Base stats
        const statNames = Object.keys(StatName);
        const individual = zipObject(statNames, times(statNames.length, () => random(0, 31))) as IStat;
        const effort = zipObject(statNames, times(statNames.length, () => 0)) as IStat;
        extend(individual, options.individual);
        extend(effort, options.effort);

        // Alternate color
        const isShiny = typeof options.isShiny === "boolean" ? options.isShiny : random(0, 4096) === 0;

        const pokemon = await Pokemon.create({
            birthDate: options.birthDate || new Date(),
            displayOT: options.displayOT || null,
            effort,
            experience,
            father: options.father,
            formIdentifier: species.pokemonForme.form_name,
            gender,
            happiness: options.happiness || species.pokemonSpecies.base_happiness,
            holdItemId: options.holdItem ? options.holdItem.id : null,
            individual,
            isEgg: options.isEgg,
            isShiny,
            level,
            mother: options.mother,
            natureId,
            speciesNumber: species.pokemonSpecies.id,
        });

        if (options.originalTrainer) {
            await pokemon.setOriginalTrainer(options.originalTrainer);
        }
        return pokemon;
    }

    public readonly id: string;
    public speciesNumber: number;
    public formIdentifier: string | null;
    public gender: Gender;
    public lostHp: number;
    public experience: number;
    public level: number;
    public readonly individual: Readonly<IStat>;
    public effort: IStat;
    public isEgg: boolean;
    public readonly isShiny: boolean;
    public getTrainer: () => Promise<Trainer | null>;
    public setTrainer: (trainer: Trainer | null) => Promise<void>;
    public happiness: number;
    public nickname: string | null;
    public getOriginalTrainer: () => Promise<Trainer | null>;
    public setOriginalTrainer: (trainer: Trainer | null) => Promise<void>;
    public displayOT: string | null;
    public meetLevel: number | null;
    public meetPlaceIndex: string | null;
    public meetDate: Date | null;
    public birthDate: Date | null;
    public getMother: () => Promise<Pokemon | null>;
    public getFather: () => Promise<Pokemon | null>;
    public tradable: boolean;
    public pokemonCenter: Date | null | undefined;
    public pokeBallId: number | null;
    // Virtual attributes
    public readonly displayId: string;
    // Private attributes
    private readonly natureId: number;
    private holdItemId: number | null;

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

    // Caculate the rest time in Pokémon Center
    public async pokemonCenterTime() {
        if (!this.pokemonCenter) {
            return 0;
        }

        let time = this.lostHp / nconf.get("app:pokemonCenterHP") * 36e5
            + this.pokemonCenter.getTime() - Date.now();
        time = Math.ceil(Math.max(time, 0));

        if (this.pokemonCenter && time === 0) {
            this.pokemonCenter = null;
            this.lostHp = 0;
            await this.save();
        }
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
    public async gainHappiness(happiness: number) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (this.happiness >= 255) {
            return;
        }

        const [trainer, holdItem, pokeBall] = await Promise.all([this.getTrainer(), this.holdItem(), this.pokeBall()]);
        const luckySpecies = trainer && await trainer.luckSpecies();
        if (happiness > 0 && holdItem && holdItem.name === "soothe-bell") {
            happiness = Math.round(happiness * 1.5);
        }
        if (happiness > 0 && pokeBall && pokeBall.name === "luxury-ball") {
            happiness *= 2;
        }
        if (happiness > 0 && luckySpecies && this.speciesNumber === luckySpecies.pokemonSpecies.id) {
            happiness *= 8;
        }
        if (this.happiness + happiness > 255) {
            happiness = 255 - this.happiness;
        }
        if (this.happiness + happiness < 0) {
            happiness = -this.happiness;
        }
        this.happiness += happiness;
        await this.save();
    }

    // Gain experience
    public async gainExperience(experience: number) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        const species = await this.species();
        const growthRateExpLevels = keyBy(await species.growthRateExpLevels(), "level");
        const maxExperience = growthRateExpLevels[100].experience;
        const currentLevel = this.level;
        const currentExperience = this.experience;
        if (currentExperience >= maxExperience) {
            return;
        }
        this.experience = Math.min(this.experience + experience, maxExperience);
        if (this.experience === currentExperience) {
            return;
        }
        this.level = range(100, currentLevel - 1, -1)
            .find((level) => this.experience >= growthRateExpLevels[level].experience)!;
        await this.save();
        for (const level of range(this.level + 1, currentLevel + 1)) {
            await this.handleLevelUp(level);
        }
    }

    // Level up
    public async levelUp() {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        if (this.level >= 100) {
            return;
        }
        const species = await this.species();
        this.level += 1;
        this.experience = await species.experience(this.level);
        await this.save();
        await this.handleLevelUp(this.level);
    }

    // Gain HP
    public async gainHP(hp: number) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        const stats = (await this.stats())!;
        hp = Math.min(-stats.hp, Math.max(this.lostHp, hp));
        if (hp === 0) {
            return;
        }
        this.lostHp -= hp;
        // Fainted, send to Pokémon Center
        if (hp === -stats.hp) {
            this.pokemonCenter = new Date();
        }
        await this.save();
    }

    // Gain effort values
    public async gainEffort(effort: Partial<IStat>) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        let currentEffort = Math.max(sum(Object.values(this.effort)), 510);
        const prevEffort = currentEffort;
        Object.values(StatName).forEach((key: StatName) => {
            if (!effort[key]) {
                return;
            }
            effort[key] = Math.min(Math.max(255 - this.effort[key], effort[key]!), -this.effort[key]);

            this.effort[key] += effort[key]!;
            currentEffort += effort[key]!;
        });
        if (prevEffort === currentEffort) {
            return;
        }
        effort = pickBy(effort);
        await this.save();
    }

    // Change forme
    public async changeForme(formIdentifier: string) {
        const species = await Species.find(this.speciesNumber, formIdentifier);
        this.formIdentifier = species.pokemonForme.form_name;
        await this.save();
    }

    // Set hold item
    public async setHoldItem(item: Item) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        const holdable = item.attributes.some((attribute) => attribute.name === "holdable");
        if (!holdable) {
            throw createError(ErrorMessage.ItemNotHoldable);
        }
        this.holdItemId = item.id;
        await this.save();
    }

    // Evolve this Pokémon
    public async evolve(trigger: string, options: IEvolveOptions = {}) {
        if (this.isEgg) {
            throw createError(ErrorMessage.PokemonIsEgg);
        }
        if (await this.pokemonCenterTime()) {
            throw createError(ErrorMessage.PokemonInPC);
        }
        const newSpecies = await findEvolution(this, trigger, options);
        if (newSpecies) {
            this.speciesNumber = newSpecies.pokemonSpecies.id;
            this.formIdentifier = newSpecies.pokemonForme.form_name;
            await this.save();
        }
    }

    private async handleLevelUp(level: number) {
        const happiness = this.happiness < 100 ? 5 : (this.happiness < 200 ? 3 : 2);
        await this.gainHappiness(happiness);
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
    gender: { type: DataTypes.ENUM(...Object.keys(Gender)), allowNull: false },
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
